const express = require("express");
const path = require("path");
const twilio = require("twilio");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 3000;


/* =========================================================
   TWILIO CONFIGURATION
========================================================= */

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const twilioFromNumber =
    process.env.TWILIO_FROM_NUMBER;

const familyPhone =
    process.env.FAMILY_PHONE;


/* =========================================================
   TWILIO CLIENT
========================================================= */

let twilioClient = null;

if (accountSid && authToken) {

    twilioClient = twilio(
        accountSid,
        authToken
    );

}


/* =========================================================
   MIDDLEWARE
========================================================= */

app.use(express.json());

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);


/* =========================================================
   BASIC HEALTH CHECK
========================================================= */

app.get("/api/health", (req, res) => {

    res.json({

        success: true,

        backend:
            "RakshaQR backend is running",

        smsConfigured:
            Boolean(
                twilioClient &&
                twilioFromNumber &&
                familyPhone
            )

    });

});


/* =========================================================
   CONTACT FAMILY
========================================================= */

app.post(
    "/api/contact-family",
    async (req, res) => {

        try {

            console.log(
                "\n========================================"
            );

            console.log(
                "RAKSHAQR FAMILY ALERT TRIGGERED"
            );

            console.log(
                "========================================"
            );


            /* -----------------------------------------
               Check Twilio configuration
            ----------------------------------------- */

            if (
                !twilioClient ||
                !twilioFromNumber ||
                !familyPhone
            ) {

                console.error(
                    "Twilio configuration is incomplete."
                );

                return res.status(500).json({

                    success: false,

                    message:
                        "SMS service is not configured yet."

                });

            }


            /* -----------------------------------------
               Get emergency information
            ----------------------------------------- */

            const {

                emergencyId,
                latitude,
                longitude

            } = req.body || {};


            /* -----------------------------------------
               Generate Google Maps location
            ----------------------------------------- */

            let locationText =
                "Location unavailable";

            if (
                latitude !== undefined &&
                longitude !== undefined
            ) {

                locationText =
                    `https://maps.google.com/?q=${latitude},${longitude}`;

            }


            /* -----------------------------------------
               Emergency SMS
            ----------------------------------------- */

            const smsBody =

`🚨 RAKSHAQR EMERGENCY ALERT

An emergency QR scan has been triggered.

Emergency ID:
${emergencyId || "RQ-DEMO-001"}

The registered emergency contact has been notified.

Live Location:
${locationText}

Please respond immediately and contact the victim's support network.

— RakshaQR Emergency System`;


            console.log(
                "Sending emergency SMS..."
            );


            /* -----------------------------------------
               SEND SMS THROUGH TWILIO
            ----------------------------------------- */

            const message =
                await twilioClient.messages.create({

                    body: smsBody,

                    from:
                        twilioFromNumber,

                    to:
                        familyPhone

                });


            /* -----------------------------------------
               SUCCESS
            ----------------------------------------- */

            console.log(
                "SMS successfully submitted."
            );

            console.log(
                "Message SID:",
                message.sid
            );

            console.log(
                "========================================\n"
            );


            return res.json({

                success: true,

                message:
                    "Emergency alert sent successfully.",

                alertStatus:
                    "Emergency Alerts Dispatched Successfully.",

                messageSid:
                    message.sid

            });


        }

        catch (error) {

            console.error(
                "\nRakshaQR SMS ERROR:"
            );

            console.error(
                error.message
            );


            return res.status(500).json({

                success: false,

                message:
                    "Emergency alert could not be sent.",

                error:
                    error.message

            });

        }

    }
);


/* =========================================================
   START SERVER
========================================================= */

app.listen(
    PORT,
    () => {

        console.log(
            "\n========================================"
        );

        console.log(
            "       RAKSHAQR SERVER ONLINE"
        );

        console.log(
            "========================================"
        );

        console.log(
            `Website: http://localhost:${PORT}`
        );

        console.log(
            `Health:  http://localhost:${PORT}/api/health`
        );

        console.log(
            `SMS:     ${
                twilioClient &&
                twilioFromNumber &&
                familyPhone
                    ? "CONFIGURED"
                    : "NOT CONFIGURED"
            }`
        );

        console.log(
            "========================================\n"
        );

    }
);