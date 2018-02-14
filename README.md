## Getting started: 

* Create a copy of ```serverless.example.env.yml``` and call it ```serverless.env.yml``` and fill the corresponding values

* Install the dependencies:

```npm install```

* Initialize the server:

```npm run start```

or 

```npm run debug```

Start by reading ```serverless.yml```. Also, read the [AWS serverless.yml docs](https://serverless.com/framework/docs/providers/aws/guide/serverless.yml/)

## Deploying to AWS

* Install the [AWS CLI](https://aws.amazon.com/cli/)

* Configure your credentials:

```aws configure```

* Create a role and configure it on your current environment on the ```PROVIDER_ROLE_ARN``` key and run

```npm run deploy```
