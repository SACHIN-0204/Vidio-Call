import React, { useContext, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, CircularProgress } from '@mui/material'
import { AuthContext } from '../contexts/AuthContext'

export default function VerifyEmail() {
    const { token } = useParams();
    const navigate = useNavigate();
    const { verifyEmail } = useContext(AuthContext);

    const [status, setStatus] = useState("loading"); // loading | success | error
    const [message, setMessage] = useState("");

    useEffect(() => {
        let isMounted = true;

        const runVerification = async () => {
            try {
                const result = await verifyEmail(token);
                if (isMounted) {
                    setStatus("success");
                    setMessage(result);
                }
            } catch (err) {
                if (isMounted) {
                    setStatus("error");
                    setMessage(err.response?.data?.message || "Something went wrong verifying your email.");
                }
            }
        };

        runVerification();

        return () => { isMounted = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            textAlign: "center"
        }}>
            {status === "loading" && (
                <>
                    <CircularProgress />
                    <p style={{ marginTop: "20px" }}>Verifying your email...</p>
                </>
            )}

            {status === "success" && (
                <>
                    <h2 style={{ color: "green" }}>✓ Email Verified</h2>
                    <p style={{ marginTop: "10px" }}>{message}</p>
                    <Button variant="contained" sx={{ mt: 3 }} onClick={() => navigate("/auth")}>
                        Go to Login
                    </Button>
                </>
            )}

            {status === "error" && (
                <>
                    <h2 style={{ color: "red" }}>Verification Failed</h2>
                    <p style={{ marginTop: "10px" }}>{message}</p>
                    <Button variant="contained" sx={{ mt: 3 }} onClick={() => navigate("/auth")}>
                        Back to Login
                    </Button>
                </>
            )}
        </div>
    )
}