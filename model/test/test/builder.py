import os
from IPython.display import Image


def graph_to_png(graph_image):
    """
    IPython.display.Image 객체를 PNG 파일로 저장하는 함수
    """
    # ✅ 반환된 graph_image가 Image 객체인지 확인
    if not isinstance(graph_image, Image):
        print("❌ Error: graph_image is not a valid IPython Image object.")
        print("Received type:", type(graph_image))
        return

    save_path = os.path.join(os.getcwd(), "langgraph_visualization.png")

    try:
        # ✅ 이미지 데이터를 파일로 저장
        with open(save_path, "wb") as f:
            f.write(graph_image.data)

        print(f"📂 그래프 이미지 저장 완료: {save_path}")
    except Exception as e:
        print(f"❌ Error saving graph image: {e}")
