02-10 모델 초기안 faiss-bart/bert-llm 모델 완성

랭체인 프롬트 테스트 요청(에러 검출)

## 파라미터 나중에 다시 조정 😭

/MOE_crewai 생성
증류 생성

학습 교사 모델: meta-llama/Llama-3.3-70B

의도 탐지 -> MOE Encoder -> Expert 선택 → MOE Decoder
https://huggingface.co/HuggingFaceH4/zephyr-7b-beta
https://arxiv.org/abs/2310.16944
https://github.com/huggingface/alignment-handbook

Zephyr는 사용자의 의도에 맞는 응답을 제공하도록 설계된 소형 언어 모델입니다. 이 모델은 대규모 언어 모델의 성능을 소형 모델로 전달하기 위해 지식 증류(knowledge distillation) 기법을 활용합니다. 특히, Zephyr-7B는 Mistral-7B 모델을 기반으로 개발되었으며, AI 피드백(AI Feedback) 데이터를 사용하여 직접 선호 최적화(Direct Preference Optimization, DPO)를 수행함으로써 사용자 의도에 대한 정렬을 향상시켰습니다. 이러한 접근 방식은 인간의 주석 없이도 모델을 효과적으로 훈련할 수 있으며, 몇 시간 내에 완료됩니다. 결과적으로, Zephyr-7B는 MT-Bench와 같은 벤치마크에서 7B 파라미터 모델 중 최고 수준의 성능을 달성하였으며, 이는 LLAMA2-CHAT-70B와 같은 더 큰 모델을 능가하는 결과입니다

한국어 자연스러운 응답
https://huggingface.co/yanolja/EEVE-Korean-Instruct-10.8B-v1.0
https://huggingface.co/yanolja/EEVE-Korean-Instruct-2.8B-v1.0

어휘 확장: 기존 모델의 어휘를 8,960개의 한국어 토큰으로 확장하여 한국어 이해도를 높였습니다.
훈련 방법: 새로운 토큰의 임베딩을 사전 학습하고, 기존 토큰의 lm_head 임베딩을 부분적으로 미세 조정하면서 기본 모델의 다른 파라미터는 그대로 유지하는 방식으로 훈련되었습니다.
기술적 접근: 영어 중심의 모델을 한국어에 적응시키기 위해 서브워드 기반 임베딩과 7단계의 파라미터 동결 훈련 과정을 통해 효율적으로 어휘를 확장하였습니다.

tts 모듈
테스트중
