// React Landing Page with CSS Modules
import React from "react";
import { useNavigate } from 'react-router-dom';
import styles from "../styles/LandingPage.module.css";

export default function LandingPage() {
    const navigate = useNavigate();
  return (
    <div className={styles.container}>
      {/* Navbar */}
      <header className={styles.navbar}>
        <div className={styles.logo}>
            <img src="./images/aditya1-logo.png"/>
        </div>
        <div className={styles.loginButtons}>
          <button className={styles.loginBtn}
          onClick={() => navigate("/login")}
          >Login</button>
        </div>
      </header>

      {/* Hero Section */}
      <main className={styles.heroSection}>
        {/* Text Section */}
        <div className={styles.heroText}>
          <h1 className={styles.headline}>
          🧠 AI-Based Paper Evaluation.
          </h1>
          <p className={styles.description}>
            An intelligent platform that automates exam paper evaluation using AI.Save time, reduce human error, and ensure fair grading with instant feedback
          </p>
          <div className={styles.ctaWrapper}>

          </div>
        </div>

        {/* Illustration */}
        <div className={styles.heroImageWrapper}>
          <img
            src="./images/college1.jpg"
            alt="AI Paper Evaluation Illustration"
            className={styles.heroImage}
          />
        </div>
      </main>
    </div>
  );
}