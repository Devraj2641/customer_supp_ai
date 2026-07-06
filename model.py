import os
import pickle
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

MODEL_PATH = os.path.join(os.path.dirname(__file__), "ticket_classifier.pkl")

# Expanded seed dataset representing typical support tickets
SEED_DATA = [
    # Billing & Invoice
    ("I was charged twice for my subscription this month. Please refund.", "Billing & Invoice"),
    ("Where can I download my invoice for May?", "Billing & Invoice"),
    ("My credit card payment keeps failing. How do I update it?", "Billing & Invoice"),
    ("How do I cancel my subscription and get a refund?", "Billing & Invoice"),
    ("I need to change my billing address on the invoices.", "Billing & Invoice"),
    ("Can I get a receipt for my annual billing transaction?", "Billing & Invoice"),
    ("There is a pricing mismatch on my billing statement.", "Billing & Invoice"),
    ("I was billed during the free trial period. Why?", "Billing & Invoice"),
    ("Do you accept PayPal or wire transfers for payment?", "Billing & Invoice"),
    ("Please renew my premium plan manually.", "Billing & Invoice"),

    # Technical Support
    ("The website is extremely slow and takes forever to load.", "Technical Support"),
    ("I am getting a 500 internal server error when trying to upload a file.", "Technical Support"),
    ("The app keeps crashing every time I open the dashboard.", "Technical Support"),
    ("My connection timed out while syncing data. Please help.", "Technical Support"),
    ("The download button on the reports page is not responding.", "Technical Support"),
    ("Is the server down? I cannot reach the login page.", "Technical Support"),
    ("I found a bug in the settings page where it doesn't save.", "Technical Support"),
    ("The mobile application fails to sync with the desktop version.", "Technical Support"),
    ("The images are not loading in the main feed.", "Technical Support"),
    ("Getting a blank screen after clicking save on my profile.", "Technical Support"),

    # Account & Access
    ("I forgot my password. Can you send a reset link?", "Account & Access"),
    ("My account has been locked. How do I unlock it?", "Account & Access"),
    ("How can I change my primary account email address?", "Account & Access"),
    ("I cannot login to my account, it says invalid credentials.", "Account & Access"),
    ("How do I enable two-factor authentication (2FA) on my account?", "Account & Access"),
    ("I want to delete my account and remove my personal data.", "Account & Access"),
    ("Our team owner left. How do we transfer account ownership?", "Account & Access"),
    ("I am not receiving the verification code email.", "Account & Access"),
    ("Can I link my Google account to login?", "Account & Access"),
    ("It says my session has expired repeatedly during usage.", "Account & Access"),

    # Product Inquiry
    ("Does your platform support integrations with Slack and Jira?", "Product Inquiry"),
    ("How do I export my tickets data into a CSV or Excel file?", "Product Inquiry"),
    ("Is there a dark mode option available for the user interface?", "Product Inquiry"),
    ("Can we add custom fields to our ticket dashboards?", "Product Inquiry"),
    ("How do I invite team members to our workspace?", "Product Inquiry"),
    ("What are the limits on the number of tickets we can create?", "Product Inquiry"),
    ("Do you offer a REST API for developers to query ticket logs?", "Product Inquiry"),
    ("Can I change the notification settings for incoming tickets?", "Product Inquiry"),
    ("Is there a tutorial on how to set up SLA rules?", "Product Inquiry"),
    ("Does this software support multi-language customer replies?", "Product Inquiry")
]

class SupportTicketClassifier:
    def __init__(self):
        self.pipeline = None
        self.load_model()

    def train_default(self):
        """Train model using seed data if no saved model exists."""
        df = pd.DataFrame(SEED_DATA, columns=["text", "category"])
        self.train(df["text"].tolist(), df["category"].tolist())

    def train(self, texts, categories):
        """Train model on a list of texts and categories, then save it."""
        pipeline = Pipeline([
            ('tfidf', TfidfVectorizer(ngram_range=(1, 2), stop_words='english', min_df=1)),
            ('clf', LogisticRegression(C=1.0, max_iter=200))
        ])
        
        pipeline.fit(texts, categories)
        self.pipeline = pipeline
        
        # Save to file
        with open(MODEL_PATH, "wb") as f:
            pickle.dump(self.pipeline, f)
        print("Model trained and saved to:", MODEL_PATH)

    def load_model(self):
        """Load model from file, or train default if file doesn't exist."""
        if os.path.exists(MODEL_PATH):
            try:
                with open(MODEL_PATH, "rb") as f:
                    self.pipeline = pickle.load(f)
                print("Model loaded successfully from:", MODEL_PATH)
            except Exception as e:
                print("Error loading model, retraining default...", e)
                self.train_default()
        else:
            print("No pre-trained model found. Training default seed model...")
            self.train_default()

    def predict(self, text):
        """Predict the category and return confidence. Fallback if low confidence."""
        if not self.pipeline:
            return "Manual Triage", 0.0

        # Predict probability
        probs = self.pipeline.predict_proba([text])[0]
        classes = self.pipeline.classes_
        max_idx = np.argmax(probs)
        confidence = float(probs[max_idx])
        predicted_class = classes[max_idx]

        # If confidence is below threshold, route to Manual Triage
        CONFIDENCE_THRESHOLD = 0.35
        if confidence < CONFIDENCE_THRESHOLD:
            return "Manual Triage", confidence
        
        return predicted_class, confidence

# Singleton instance
classifier = SupportTicketClassifier()
