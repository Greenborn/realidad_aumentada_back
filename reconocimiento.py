# Import PyTorch module
import torch
import cv2
from flask import *
import base64
from flask import request
import numpy as np

app = Flask( __name__ )

# Download model from github
model = torch.hub.load('ultralytics/yolov5', 'yolov5n')

def readb64(uri):
   encoded_data = uri.split(',')[1]
   nparr = np.fromstring(base64.b64decode(encoded_data), np.uint8)
   img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
   return img

@app.route("/process", methods=['POST'])
def home():
    base64_ = request.json["base64"]
    #print(base64_)
    img = readb64(base64_)

    # Perform detection on image
    result = model(img)
    print('result: ', result)

    # Convert detected result to pandas data frame
    data_frame = result.pandas().xyxy[0]
    print('data_frame:')
    print(data_frame)

    # Get indexes of all of the rows
    indexes = data_frame.index
    data_ = []
    for index in indexes:
        # Find the coordinate of top left corner of bounding box
        x1 = int(data_frame['xmin'][index])
        y1 = int(data_frame['ymin'][index])
        # Find the coordinate of right bottom corner of bounding box
        x2 = int(data_frame['xmax'][index])
        y2 = int(data_frame['ymax'][index ])

        # Find label name
        label = data_frame['name'][index ]
        # Find confidance score of the model
        conf = data_frame['confidence'][index]
        text = label + ' ' + str(conf.round(decimals= 2))

        cv2.rectangle(img, (x1,y1), (x2,y2), (255,255,0), 2)
        cv2.putText(img, text, (x1,y1-5), cv2.FONT_HERSHEY_PLAIN, 2,
                    (255,255,0), 2)
        data_.append( { 'x1': x1, 'y1': y1, 'x2': x2, 'y2': y2, 'label': label, 'text': text } )

    #cv2.imwrite('user_data/reconocimiento_ok.jpg', img)
    return data_

app.run(port=3333)
