import React from 'react'
import Cardnewsdata from '../constants/Cardnewsdata'

const Cardnews = () => {
  return (
    <div className="max-w-4xl mx-auto p-4">
      {Cardnewsdata.map((card) => (
        <div 
          key={card.id} 
          className="bg-white rounded-lg shadow-md p-6 mb-6"
        >
          <div className="mb-4">
            <h2 className="text-2xl font-bold mb-2">{card.title}</h2>
            <p className="text-gray-600">{card.date}</p>
          </div>
          
          <div className="space-y-4">
            {card.paragraphs.map((paragraph, index) => (
              <div key={index}>
                <p className="text-gray-800">{paragraph.content}</p>
                {paragraph.subcontent && (
                  <div 
                    className="mt-2 ml-4 text-gray-700"
                    dangerouslySetInnerHTML={{ __html: paragraph.subcontent }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default Cardnews