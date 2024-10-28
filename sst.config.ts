/// <reference path="./.sst/platform/config.d.ts" />

/**
 * ## Prisma in Lambda
 *
 * To use Prisma in a Lambda function you need to
 *
 * - Generate the Prisma Client with the right architecture
 * - Copy the generated client to the function
 * - Run the function inside a VPC
 *
 * You can set the architecture using the `binaryTargets` option in `prisma/schema.prisma`.
 *
 * ```prisma title="prisma/schema.prisma"
 * // For x86
 * binaryTargets = ["native", "rhel-openssl-3.0.x"]
 * // For ARM
 * // binaryTargets = ["native", "linux-arm64-openssl-3.0.x"]
 * ```
 *
 * You can also switch to ARM, just make sure to also change the function architecture in your
 * `sst.config.ts`.
 *
 * ```ts title="sst.config.ts"
 * {
 *   // For ARM
 *   architecture: "arm64"
 * }
 * ```
 *
 * To generate the client, you need to run `prisma generate` when you make changes to the
 * schema.
 *
 * Since this [needs to be done on every deploy](https://www.prisma.io/docs/orm/more/help-and-troubleshooting/help-articles/vercel-caching-issue#a-custom-postinstall-script), we add a `postinstall` script to the `package.json`.
 *
 * ```json title="package.json"
 * "scripts": {
 *   "postinstall": "prisma generate"
 * }
 * ```
 *
 * This runs the command on `npm install`.
 *
 * We then need to copy the generated client to the function when we deploy.
 *
 * ```ts title="sst.config.ts"
 * {
 *   copyFiles: [{ from: "node_modules/.prisma/client/" }]
 * }
 * ```
 *
 * Our function also needs to run inside a VPC, since Prisma doesn't support the Data API.
 *
 * ```ts title="sst.config.ts"
 * {
 *   vpc
 * }
 * ```
 *
 * #### Prisma in serverless environments
 *
 * Prisma is [not great in serverless environments](https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections#serverless-environments-faas). For a couple of reasons:
 *
 * 1. It doesn't support Data API, so you need to manage the connection pool on your own.
 * 2. Without the Data API, your functions need to run inside a VPC.
 *    - You cannot use `sst dev` without [connecting to the VPC](/docs/live#using-a-vpc).
 * 3. Due to the internal architecture of their client, it's also has slower cold starts.
 *
 * Instead we recommend using [Drizzle](https://orm.drizzle.team). This example is here for
 * reference for people that are already using Prisma.
 */
export default $config({
    app(input) {
        // console.log('input =====>>>> ', input)
        return {
            name: "sst-v3-prisma",
            removal: input?.stage === "production" ? "retain" : "remove",
            home: "aws",
            // architecture: "arm64"
        };
    },
    console: {
      autodeploy: {
        target(event) {
          // if (event.type === "branch" && event.branch === "staging") return;
          if (event.type === "branch" && event.branch === "main" && event.action === "pushed") {
            return {
              stage: "production",
              // stage: event.branch
              //     .replace(/[^a-zA-Z0-9-]/g, "-")
              //     .replace(/-+/g, "-")
              //     .replace(/^-/g, "")
              //     .replace(/-$/g, ""),
              runner: {
                  engine: "codebuild",
                  compute: "small", //large
                  // architecture: "x86_64", //arm64
                  // timeout: "1 hour"
              }
            };
          }

          if (event.type === "pull_request") {
            return { stage: `pr-${event.number}` };
          }
        }
      }
    },
    async run() {

        // console.log('process.env =====>>>>', process.env)
        const stage = process.env.SST_STAGE as string

        $transform(sst.aws.Function, (args, opts) => {
            // console.log('=====>>>>', args, opts)
          // args.runtime = "nodejs14.x";
          args.environment = {
              DATABASE_URL: process.env.DATABASE_URL as string,
              // ACCOUNT: aws.getCallerIdentityOutput({}).accountId,
              // REGION: aws.getRegionOutput().name
          };
        });

        new sst.x.DevCommand('Prisma Studio', {
            environment: {DATABASE_URL: process.env.DATABASE_URL as string},
            dev: {
                autostart: false,
                command: 'npx prisma studio'
            }
        })

        // const vpc = new sst.aws.Vpc("MyVpc", { nat: "managed",
        //     //nat: 'ec2',
        //     // az: 1 //no lb
        // });
        // // const rds = new sst.aws.Postgres("MyPostgres", { vpc });

        const api = new sst.aws.Function("MyApi", {
            // vpc,
            url: true,
            // link: [rds],
            // For ARM
            // architecture: "arm64",
            handler: "index.handler",
            // environment: {
            //     DATABASE_URL: process.env.DATABASE_URL as string,
            // }
            // copyFiles: [{ from: "node_modules/.prisma/client/" }],
        });

        return {
            api: api.url,
        };
    },
});
