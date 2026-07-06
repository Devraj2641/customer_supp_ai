import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from model import classifier

app = FastAPI(title="AI Ticket Routing Microservice", version="1.0.0")

# Enable CORS for communication from Node.js backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ClassificationRequest(BaseModel):
    text: str

class ClassificationResponse(BaseModel):
    category: str
    confidence: float

class TicketExample(BaseModel):
    text: str
    category: str

class RetrainRequest(BaseModel):
    examples: List[TicketExample]

@app.get("/health")
def health():
    return {"status": "healthy", "model_loaded": classifier.pipeline is not None}

@app.post("/classify", response_model=ClassificationResponse)
def classify_ticket(req: ClassificationRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")
    
    try:
        category, confidence = classifier.predict(req.text)
        return ClassificationResponse(category=category, confidence=confidence)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Classification error: {str(e)}")

@app.post("/train")
def train_model(req: RetrainRequest):
    if not req.examples:
        raise HTTPException(status_code=400, detail="Examples list cannot be empty.")
    
    try:
        texts = [ex.text for ex in req.examples]
        categories = [ex.category for ex in req.examples]
        
        # Add to the seed data to preserve initial knowledge
        from model import SEED_DATA
        for text, category in SEED_DATA:
            texts.append(text)
            categories.append(category)

        classifier.train(texts, categories)
        return {"status": "success", "message": f"Model successfully retrained on {len(texts)} samples."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training error: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=5000)
