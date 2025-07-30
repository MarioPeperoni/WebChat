from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from app.routes import chat, user

app = FastAPI()

app.include_router(chat.router)
app.include_router(user.router)

app.add_middleware(CORSMiddleware, allow_origins=["*"])