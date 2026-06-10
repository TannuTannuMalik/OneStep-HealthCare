// ─── POST /api/payments/confirm ───────────────────────────────────────────────
router.post("/confirm", authRequired, async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { paymentIntentId, appointmentData } = req.body;

    if (!paymentIntentId || !appointmentData) {
      await connection.rollback();
      return res.status(400).json({
        ok: false,
        error: "Missing payment information",
      });
    }

    const {
      doctorId,
      requestedStart,
      requestedEnd,
      appointmentType,
      patientNote,
    } = appointmentData;

    const patientId = req.user.id;

    // Validate required fields
    if (!doctorId || !requestedStart || !requestedEnd) {
      await connection.rollback();
      return res.status(400).json({
        ok: false,
        error: "Missing appointment details",
      });
    }

    // Prevent booking in the past
    if (new Date(requestedStart) < new Date()) {
      await connection.rollback();
      return res.status(400).json({
        ok: false,
        error: "Cannot book appointments in the past",
      });
    }

    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(
      paymentIntentId
    );

    if (paymentIntent.status !== "succeeded") {
      await connection.rollback();
      return res.status(400).json({
        ok: false,
        error: `Payment not completed. Status: ${paymentIntent.status}`,
      });
    }

    // Prevent duplicate processing
    const [existingAppointment] = await connection.query(
      `SELECT id FROM appointments WHERE stripePaymentId = ?`,
      [paymentIntentId]
    );

    if (existingAppointment.length > 0) {
      await connection.rollback();
      return res.status(409).json({
        ok: false,
        error: "Payment already processed",
      });
    }

    // Verify doctor exists
    const [doctorRows] = await connection.query(
      `
      SELECT d.id, u.fullName
      FROM doctors d
      JOIN users u ON d.userId = u.id
      WHERE d.id = ?
      `,
      [doctorId]
    );

    if (doctorRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        ok: false,
        error: "Doctor not found",
      });
    }

    // Check overlapping appointments
    const [conflicts] = await connection.query(
      `
      SELECT id
      FROM appointments
      WHERE doctorId = ?
      AND status IN ('REQUESTED', 'APPROVED')
      AND (
          requestedStart < ?
          AND requestedEnd > ?
      )
      `,
      [doctorId, requestedEnd, requestedStart]
    );

    if (conflicts.length > 0) {
      await connection.rollback();
      return res.status(409).json({
        ok: false,
        error: "Selected time slot is already booked",
      });
    }

    // Create appointment
    const [result] = await connection.query(
      `
      INSERT INTO appointments
      (
        patientId,
        doctorId,
        requestedStart,
        requestedEnd,
        appointmentType,
        patientNote,
        status,
        paymentStatus,
        stripePaymentId,
        consultationFee
      )
      VALUES
      (
        ?, ?, ?, ?, ?, ?,
        'REQUESTED',
        'PAID',
        ?,
        ?
      )
      `,
      [
        patientId,
        doctorId,
        requestedStart,
        requestedEnd,
        appointmentType,
        patientNote || null,
        paymentIntentId,
        CONSULTATION_FEE / 100,
      ]
    );

    await connection.commit();

    console.log("PAYMENT CONFIRMED", {
      appointmentId: result.insertId,
      paymentIntentId,
      patientId,
      doctorId,
      amount: CONSULTATION_FEE / 100,
      timestamp: new Date(),
    });

    // Socket notification
    const io = req.app.get("io");

    if (io) {
      io.to(`user:${patientId}`).emit("appointment-booked", {
        appointmentId: result.insertId,
        message: "Appointment booked and payment confirmed!",
      });
    }

    return res.json({
      ok: true,
      appointmentId: result.insertId,
      paymentIntentId,
      amount: CONSULTATION_FEE / 100,
      message: "Payment confirmed and appointment booked!",
    });

  } catch (err) {
    await connection.rollback();

    console.error("POST /api/payments/confirm error:", err);

    return res.status(500).json({
      ok: false,
      error: err.message,
    });

  } finally {
    connection.release();
  }
});