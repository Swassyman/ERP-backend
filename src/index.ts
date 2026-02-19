import cookieParser from "cookie-parser";
import express from "express";
import userRouter from "./routes/user.routes.js";

const PORT = Number(process.env.PORT) || 3192;
if (Number.isNaN(PORT) || !Number.isInteger(PORT)) {
    throw new Error("Invalid PORT specified");
}

const app = express();
app.use((req, _res, next) => {
    console.log(req.method, req.hostname, req.path);
    next();
});

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN as string;
if (!process.env.FRONTEND_ORIGIN) {
    throw new Error("FRONTEND_ORIGIN must be set");
}

app.use((req, res, next) => {
    if (req.headers.origin === FRONTEND_ORIGIN) {
        res.setHeader("Access-Control-Allow-Origin", FRONTEND_ORIGIN);
        res.setHeader("Access-Control-Allow-Credentials", "true");
        res.setHeader(
            "Access-Control-Allow-Methods",
            "GET,POST,PATCH,PUT,DELETE,OPTIONS",
        );
        res.setHeader(
            "Access-Control-Allow-Headers",
            "Content-Type,Authorization",
        );
    }
    if (req.method === "OPTIONS") {
        res.setHeader("Access-Control-Max-Age", "86400"); // cache pre-flight for 24h
        res.sendStatus(204);
        return;
    }
    next();
});

app.use(cookieParser());
app.use(express.json());

// Routes
app.use("/user", userRouter);

// Health
app.get("/", (_req, res) => {
    res.status(200).json({ status: "active" });
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on port ${PORT} at http://localhost:${PORT}`);
});
