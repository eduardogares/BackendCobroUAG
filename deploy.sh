#!/usr/bin/env bash
branch=$(git branch | sed -n -e 's/^\* \(.*\)/\1/p')
if [ ${branch} = master ]
then
    if [ $1 ]
    then
      serverless deploy function --function $1 --stage production -t
    else
      serverless deploy --stage production -t
    fi
elif [ ${branch} = rc ]
then
    if [ $1 ]
    then
      serverless deploy function --function $1 --stage rc -t
    else
      serverless deploy --stage rc -t
    fi
elif [ ${branch} = development ]
then
    if [ $1 ]
    then
      export SLS_DEBUG=* && serverless deploy function --function $1 --stage development -t
    else
      export SLS_DEBUG=* && serverless deploy --stage development -t
    fi
else
    if [ $1 ]
    then
      export SLS_DEBUG=* && serverless deploy function --function $1 --stage ${branch} -t
    else
      export SLS_DEBUG=* && serverless deploy --stage ${branch} -t
    fi
fi
