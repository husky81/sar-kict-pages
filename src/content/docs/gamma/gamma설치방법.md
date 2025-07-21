---
title: Gamma Ubuntu 설치 방법
description: A reference page in my new Starlight docs site.
---

## AWS 제원

- EC2: t3.medium Ubuntu 8G
- S3: sar001/Gamma SAR
- AMI: Ubuntu Server 22.04 LTS (HVM), SSD Volume Type ami-08943a151bd468f4e

Gamma 2404 버젼 설치파일은 파일 오류가 있음. 2204버젼으로 설치 진행함. 

## 설치 스크립트

- Ubuntu 22.04 AWS 기본 이미지의 업그레이드는 커널 업그레이드를 포함하므로 재부팅이 필요하다.

```bash
sudo apt update
sudo apt upgrade -y
sudo reboot
# VSCode 윈도우가 reload됨.
```

- 재부팅 후 아래 스크립트 실행

```bash
# Gamma binary 설치파일 다운로드 및 압축해제
sudo apt install unzip -y
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
rm awscliv2.zip
aws s3 cp "s3://sar001/Gamma SAR/GAMMA_SOFTWARE-20241205_ISP_DIFF_IPTA.linux64_ubuntu2204.tar.gz" .

# 압축풀기
export GAMMA=$HOME
# 2404 파일은 에러가 남. 다운로드를 다시 받아야할듯.
cp GAMMA_SOFTWARE-20241205_ISP_DIFF_IPTA.linux64_ubuntu2204.tar.gz $GAMMA
gunzip -c GAMMA_SOFTWARE-20241205_ISP_DIFF_IPTA.linux64_ubuntu2204.tar.gz > GAMMA_SOFTWARE-20241205.linux.tar
tar -xvf GAMMA_SOFTWARE-20241205.linux.tar
rm GAMMA_SOFTWARE-20241205_ISP_DIFF_IPTA.linux64_ubuntu2204.tar.gz
rm GAMMA_SOFTWARE-20241205.linux.tar

# Set Environment Variables
export GAMMA=$HOME
export GAMMA_HOME=$HOME/GAMMA_SOFTWARE-20241205
export ISP_HOME=$GAMMA_HOME/ISP
export DIFF_HOME=$GAMMA_HOME/DIFF
export DISP_HOME=$GAMMA_HOME/DISP
export LAT_HOME=$GAMMA_HOME/LAT
export IPTA_HOME=$GAMMA_HOME/IPTA
export GEO_HOME=$GAMMA_HOME/GEO
export PATH=$PATH:.:$MSP_HOME/bin:$ISP_HOME/bin:$DIFF_HOME/bin:$LAT_HOME/bin:$IPTA_HOME/bin:$GEO_HOME/bin:$DISP_HOME/bin:$MSP_HOME/scripts:$ISP_HOME/scripts:$DIFF_HOME/scripts:$LAT_HOME/scripts:$IPTA_HOME/scripts:$GEO_HOME/scripts:$DISP_HOME/scripts
export OS=linux64

#This adds the Gamma Software main directory to the Python path 
export PYTHONPATH=.:$GAMMA_HOME:$PYTHONPATH
#This command disables version checking for HDF5 
export HDF5_DISABLE_VERSION_CHECK=1
#Alternately, this sets the default terminal type to be WXT 
export GNUTERM=wx

#set default raster format to BMP 
#export GAMMA_RASTER="BMP"
export GAMMA_RASTER="TIFF"
#export GAMMA_RASTER="SUN_RASTER"

# FFTW3 소스코드설치
# apt install 실행하면 libfftw3-3 라이브러리가 없다고 나옴
aws s3 cp s3://sar001/fftw-3.3.4.tar.gz .
tar -xzf fftw-3.3.4.tar.gz
cd fftw-3.3.4/
sudo apt update
sudo apt install make
sudo apt install build-essential -y
./configure --disable-fortran --enable-single --enable-shared --enable-sse --enable-sse2
make # 3~5분 쯤 걸리는듯. warning 8개 정도 뜨고, 에러는 없음.
sudo make install
cd ..
rm fftw-3.3.4.tar.gz

# 나머지 설치
sudo apt install gnuplot gnuplot-qt gnuplot-data gimp gnome-icon-theme -y
sudo apt install gdal-bin libgdal-dev -y
sudo apt install libhdf5-dev libhdf5-103-1t64 -y
sudo apt install libnetcdf-dev -y
sudo apt install libblas-dev libblas3 liblapack-dev liblapack3 liblapack-doc -y

# 실행확인
disras

# 추가설치
# 10. Install tcsh, perl
sudo apt install tcsh perl -y
# 11. Installation of Python 3
sudo apt install python3
sudo apt install python-is-python3
sudo apt install python3-numpy python3-matplotlib python3-scipy python3-shapely python3-packaging -y

# 실행 확인
par_S1_SLC

```

## .bashrc 설정
Export 환경변수들은 다시 접속할 때 초기화되므로 .bashrc에 넣어둔다.

```bash
# .bashrc 파일에 아래 내용 추가
# 설치 스크립트의 환경설정부분과 동일함

# Set Environment Variables
export GAMMA=$HOME
export GAMMA_HOME=$HOME/GAMMA_SOFTWARE-20241205
export ISP_HOME=$GAMMA_HOME/ISP
export DIFF_HOME=$GAMMA_HOME/DIFF
export DISP_HOME=$GAMMA_HOME/DISP
export LAT_HOME=$GAMMA_HOME/LAT
export IPTA_HOME=$GAMMA_HOME/IPTA
export GEO_HOME=$GAMMA_HOME/GEO
export PATH=$PATH:.:$MSP_HOME/bin:$ISP_HOME/bin:$DIFF_HOME/bin:$LAT_HOME/bin:$IPTA_HOME/bin:$GEO_HOME/bin:$DISP_HOME/bin:$MSP_HOME/scripts:$ISP_HOME/scripts:$DIFF_HOME/scripts:$LAT_HOME/scripts:$IPTA_HOME/scripts:$GEO_HOME/scripts:$DISP_HOME/scripts
export OS=linux64

#This adds the Gamma Software main directory to the Python path 
export PYTHONPATH=.:$GAMMA_HOME:$PYTHONPATH
#This command disables version checking for HDF5 
export HDF5_DISABLE_VERSION_CHECK=1
#Alternately, this sets the default terminal type to be WXT 
export GNUTERM=wx

#set default raster format to BMP 
#export GAMMA_RASTER="BMP"
export GAMMA_RASTER="TIFF"
#export GAMMA_RASTER="SUN_RASTER"
```

[(tried) Gamma SAR 우분투 설치](https://www.notion.so/tried-Gamma-SAR-22b6023ebd648066a30ce83999a7e65b?pvs=21)
