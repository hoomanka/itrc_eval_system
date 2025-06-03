from fastapi import FastAPI

app = FastAPI()

@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.get("/test")  
async def test():
    return {"test": "working"}

if __name__ == "__main__":
    import uvicorn
    print("Starting minimal server...")
    uvicorn.run(app, host="127.0.0.1", port=8002, log_level="info") 