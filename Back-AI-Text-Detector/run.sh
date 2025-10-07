apt update
apt-get install -y python3-pybind11
python3 -m pip install --upgrade pip
pip install -r requirements.txt
export FLASK_ENV=production
python3 main.py