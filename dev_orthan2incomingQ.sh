pm2 delete orthanc2incomingQ
pm2 start bin/orthanc2incomingQ.js --watch --ignore-watch="\.log$ \.css$ \.less$ \.sh$"
pm2 save
#pm2 logs orthanc2incomingQ