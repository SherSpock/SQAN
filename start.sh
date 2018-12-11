
pm2 delete rady-api
pm2 start api/dicom.js --name="rady-api" --watch --ignore-watch="\.log \.git \.sh bin ui" --output /opt/sca/tmp/.pm2/logs/rady-api.out --error /opt/sca/tmp/.pm2/logs/rady-api.err

pm2 delete cleanAndStore
pm2 start bin/cleanAndStore.js --name="cleanAndStore" --watch --ignore-watch="\.log$ \.css$ \.less$ \.sh$ ui" --output /opt/sca/tmp/.pm2/logs/cleanAndStore.out --error /opt/sca/tmp/.pm2/logs/cleanAndStore.err
#pm2 logs cleanAndStore

pm2 delete orthanc2incomingQ
pm2 start bin/orthanc2incomingQ.js --name="orthanc2incomingQ" --watch --ignore-watch="\.git \.log$ \.css$ \.less$ \.sh$ ui" --output /opt/sca/tmp/.pm2/logs/orthanc2incomingQ.out --error /opt/sca/tmp/.pm2/logs/orthanc2incomingQ.err

pm2 delete qc
pm2 start bin/qc.js --name="qc" --watch --ignore-watch="\.log$ \.sh$ ui \.git" --output /opt/sca/tmp/.pm2/logs/qc.out --error /opt/sca/tmp/.pm2/logs/qc.err

#pm2 delete qc_exams
#pm2 start bin/qc_exams.js --name="qc_exams" --watch --ignore-watch="\.log$ \.sh$ ui \.git" --output /opt/sca/tmp/.pm2/logs/qc_exams.out --error /opt/sca/tmp/.pm2/logs/qc_exams.err

pm2 save
