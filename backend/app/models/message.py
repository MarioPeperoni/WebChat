from pydantic import BaseModel, Field

class User(BaseModel):
    name: str = Field(max_length=16, min_length=2)
    color: str = Field(default="#000000")

class MessageIn(BaseModel):
    user: User
    content: str = Field(max_length=256, min_length=1)

class MessageOut(MessageIn):
    timestamp: str