import React from "react";

const Popup = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl p-8 w-[800px] h-[700px]">
        {/* 팝업 헤더 */}
        <div className="relative flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-center w-full">
            판례 요약 보기
          </h2>
          <button
            onClick={onClose}
            className="absolute right-0 text-2xl font-bold text-black hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* 팝업 내용 */}
        <div className="bg-gray-50 rounded-2xl p-6 h-[600px] overflow-y-auto">
          <div className="space-y-6">
            <div>
              <h4 className="font-bold mb-2">1. 사건 개요</h4>
              <p className="text-gray-700">
                본 사건은 피고인이 2018년 12월 15일 새벽 2시경 부산 해운대구
                소재 주점 앞에서 피해자를 흉기로 위협하여 살해하려 한
                사건입니다. 피해자는 즉시 인근 경찰서에 신고하였고, 출동한
                경찰에 의해 피고인이 현행범으로 체포되었습니다.
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-2">2. 쟁점사항</h4>
              <p className="text-gray-700">
                1) 피고인의 살인미수 고의 여부
                <br />
                2) 정당방위 성립 여부
                <br />
                3) 심신미약 상태 인정 여부
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-2">3. 판단요지</h4>
              <p className="text-gray-700">
                법원은 다음과 같은 이유로 피고인의 항소를 기각하였습니다:
                <br />
                <br />
                1) 피고인이 사용한 흉기의 위험성, 범행 당시의 상황, 피해자의
                진술 등을 종합적으로 고려할 때 살인의 고의가 인정됩니다.
                <br />
                <br />
                2) 피해자로부터 먼저 폭행을 당했다는 피고인의 주장은 CCTV 영상
                및 목격자들의 진술과 배치되어 신빙성이 없으므로, 정당방위는
                인정되지 않습니다.
                <br />
                <br />
                3) 범행 당시 피고인의 심신미약 상태를 인정할 만한 객관적인
                증거가 부족합니다.
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-2">4. 결론</h4>
              <p className="text-gray-700">
                원심의 판단에 법리오해나 심리미진의 위법이 없다고 보아 피고인의
                항소를 기각하였습니다. 피고인의 행위는 살인미수죄의 구성요건에
                해당하며, 정당화 사유나 책임조각사유도 인정되지 않습니다.
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-2">5. 시사점</h4>
              <p className="text-gray-700">
                본 판결은 살인미수죄에서의 고의 판단 기준과 정당방위의
                성립요건을 명확히 하였다는 점에서 의의가 있습니다. 특히 CCTV
                영상 등 객관적 증거의 중요성을 재확인하였으며, 심신미약 주장에
                대한 엄격한 증명책임을 강조하였습니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Popup;
