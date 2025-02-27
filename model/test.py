from transformers import SpeechT5Processor, SpeechT5ForTextToSpeech
import torch
import soundfile as sf

# 모델 및 프로세서 로드
processor = SpeechT5Processor.from_pretrained("microsoft/speecht5_tts")
model = SpeechT5ForTextToSpeech.from_pretrained("microsoft/speecht5_tts")

# 음성 특징 불러오기 (예제 음성 스타일 제공)
embeddings_dataset = torch.load(
    "https://huggingface.co/microsoft/speecht5_tts/resolve/main/speaker_embeddings.pt"
)
speaker_embedding = embeddings_dataset[0]  # 기본 음성 사용

# 입력 텍스트
text = "안녕하세요! 마이크로소프트의 SpeechT5 모델을 사용하여 음성을 합성하고 있습니다."
inputs = processor(text=text, return_tensors="pt")

# 음성 생성
speech = model.generate_speech(inputs["input_ids"], speaker_embedding)

# 파일 저장
sf.write("output.wav", speech.numpy(), samplerate=16000)
