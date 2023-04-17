#!/bin/bash

cd connect
npm install
zip -r ../infra/connect.zip .


cd disconnect
npm install
zip -r ../infra/disconnect.zip .

cd default
npm install
zip -r ../infra/default.zip .

cd logic
npm install
zip -r ../infra/logic.zip .

