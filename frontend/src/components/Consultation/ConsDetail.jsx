import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import openLicenseImg from "../../assets/open_license.jpg";
import { TbCircleLetterQFilled, TbCircleLetterA } from "react-icons/tb";

const ConsDetail = () => {
  const { id } = useParams();
  const [consultation, setConsultation] = useState(null);

  // 임시 데이터 (나중에 실제 API로 교체)
  const consultationData = {
    1: {
      id: 1,
      category: "노동>근로일반",
      title: "회사분할로 되직금 일괄수령 후 재입사 형식 취한 경우 계속근로인지",
      question:
        "저는 무회사에 입사하여 5년째 되던 해 소속부서 업무가 Z회사로 독립되자 무회사에서 일방적으로 근로자들을 일괄 사직처리하고 퇴직금을 수령하도록 하는 남편로 Z회사에 입사한 것으로 하였습니다. 그 후 제가 Z회사를 퇴직하게 되자 Z회사에서는 Z회사 근무기간 4년 9개월에 해당되는 퇴직금만을 지급하였습니다. 이 경우 무회사에 입사한 때부터 Z회사에서 퇴직할 때까지의 기간을 계속근로년수로 하여 지급해주를 청한 누진퇴직금을 받을 수는 없는지요.",
      answer: `기업의 합병·분할·영업양도 등의 경우 근로자들이 조직변경 전후에 계속하여 근무를 하되, 일단 근로자들이 종전의 기업에서 퇴직하고 그 근무연수에 해당하는 퇴직금을 지급받은 후 새로운 기업에 신규입사형식을 취한 경우에는 근로자의 자의에 의한 것이나 아니면 회사의 경영방침에 의한 일방적 결정에 따른 것이었든 달리할 수 없습니다.

이에 관하여 판례는 "근로자가 스스로의 편으나 판단에 따라 자유로운 의사에 기하여 사용자에게 사직서 등을 제출하고 이에 따라 당해 기업으로부터 스스로 퇴직하여 자금받은 경우에는 사직서 등의 제출이 사용자의 일방적인 경영방침에 따라 어쩔 수 없이 이루어지거나 단지 형식적으로 이루어진 것으로 볼 수 없다면 당해 기업과 근로자와의 근로관계는 단절 유효하게 단절되고, 이 경우 근로자가 당해 기업에 종전의 근무경력을 인정받고 곧바로 재입사하여 계속 근무하였다고 하더라도 퇴직금 산정의 기초가 되는 계속근로년수를 산정함에 있어서는 재입사한 때로부터 기산하여야 한다."라고 하고 있습니다(대법원 1995. 7. 11. 선고 93다46198 판결, 2001. 9. 18. 선고 2000다60630 판결).

그러나 근로자 스스로의 의사에 의한 것이 아니라 회사의 일방적인 경영방침·영업 이전기업의 퇴직금을 지급하기 위한 방편이나 또는 경영방침에 의한 일방적인 결정으로 재입사의 형식을 거친 것에 불과하다면 계속근로관계는 단절되지 않고, 이 경우에는 근로자가 퇴직하면 그 기업은 종전 기업의 재직기간을 합산한 계속근로년수를 퇴직금에서 이미 지급한 퇴직금을 공제한 차액을 지급하여야 합니다(대법원 1992. 7. 14. 선고 91다40276 판결, 2005. 2. 25. 선고 2004다34790 판결).

따라서 위 사안에 있어서 귀하도 무회사에서 퇴직하고 퇴직금을 수령한 후 Z회사에 재입사한 것이 귀하의 자의에 의한 것이 아니고 회사의 경영방침에 의한 것이라면 근로관계의 계속을 수정하여 무회사에 최초로 입사한 때부터 Z회사를 퇴직하직할 때까지의 재직기간을 퇴직금산정·지급의 기초로서 산정한 퇴직금에서 무회사에서 퇴직할 때 수령한 퇴직금을 공제한 나머지 금액을 청구할 수 있을 것입니다.`,
      date: "2024-02-20",
    },
    2: {
      id: 2,
      category: "손해배상>교통사고",
      title: "교통사고 합의 관련 문의",
      content: `교통사고 합의 과정에서 발생한...`,
      date: "2024-02-19",
    },
  };

  useEffect(() => {
    // id를 사용하여 해당 상담사례 데이터 가져오기
    const fetchConsultation = () => {
      // 실제로는 API 호출이 들어갈 자리
      const data = consultationData[id];
      if (data) {
        setConsultation(data);
      }
    };

    fetchConsultation();
  }, [id]);

  if (!consultation) {
    return <div>로딩중...</div>;
  }

  return (
    <div className="container">
      <div className="left-layout">
        <div className="px-0 pt-[135px] pb-10">
          {/* 상단 정보 영역 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            {/* 구분 */}
            <div className="flex border-b border-gray-100 pb-4 mb-4">
              <span className="text-sm text-gray-500 w-20">구분</span>
              <span className="text-sm text-black">
                {consultation.category}
              </span>
            </div>

            {/* 제목 */}
            <div className="flex">
              <span className="text-sm text-gray-500 w-20">제목</span>
              <span className="text-sm text-black font-medium">
                {consultation.title}
              </span>
            </div>
          </div>

          {/* 질문 영역 */}
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center mb-4">
              <div className="flex items-center text-base font-semibold text-gray-900">
                <TbCircleLetterQFilled className="w-8 h-8 mr-2 text-black text-2xl" />
                질문
              </div>
              <div className="text-sm text-gray-500 ml-2">
                {consultation.date}
              </div>
            </div>
            <div className="whitespace-pre-wrap text-sm leading-7 text-gray-700">
              {consultation.question}
            </div>
          </div>

          {/* 답변 영역 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center text-base font-semibold text-gray-900 mb-4">
              <TbCircleLetterA className="w-8 h-8 mr-2 text-black text-2xl" />
              답변
            </div>
            <div className="whitespace-pre-wrap text-sm leading-7 text-gray-700">
              {consultation.answer}
            </div>
          </div>

          {/* 주의사항 */}
          <div className="text-xs text-gray-500 bg-gray-50 p-4 rounded-lg border border-gray-200">
            ※ 주의 : 사례에 대한 답변은 법령이나 판례 등의 변경으로 내용이 바뀔
            수 있으므로 구체적인 사안에 대해서는 반드시 대한법률구조공단
            상담(전화상담 ☎ 132) 등을 통해 다시 한 번 확인하시기 바랍니다.
          </div>

          {/* 공공누리 유형 */}
          <div className="mt-8 flex items-center gap-2">
            <img src={openLicenseImg} alt="공공누리" className="h-6" />
            <span className="text-sm text-gray-500">
              대한법률구조공단의 해당 저작물은 "공공누리 4유형(출처표시)" 조건에
              따라 누구나 이용할 수 있습니다.
            </span>
          </div>
        </div>
      </div>
      <div className="right-layout">{/* 빈 공간으로 남겨둠 */}</div>
    </div>
  );
};

export default ConsDetail;
