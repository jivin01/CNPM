import asyncio
import random

async def analyze_retinal_vasculature(image_url: str):
    # Giả lập thời gian xử lý AI (10 giây) theo NFR-1
    await asyncio.sleep(10) 
    
    risk_levels = ["Low", "Medium", "High"]
    return {
        "image_id": image_url.split('/')[-1],
        "risk_level": random.choice(risk_levels),
        "confidence": round(random.uniform(0.85, 0.98), 2),
        "findings": "Subtle vascular abnormalities detected."
    }