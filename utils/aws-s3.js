const dotenv = require("dotenv");
const fs = require("fs");
dotenv.config();
const s3 = require("@aws-sdk/client-s3");
const mime = require("mime-types");
const { base } = require("./public");
const bucket = process.env.AWS_S3_BUCKET;

const client = new s3.S3Client({
  region: process.env.AWS_S3_REGION,
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
  },
});

exports.helloS3 = async () => {
  const command = new s3.ListBucketsCommand({});

  const { Buckets } = await client.send(command);
  // console.log("Buckets: ");
  // console.log(Buckets.map((bucket) => bucket.Name).join("\n"));
  if (Buckets) {
    console.log("S3 successfully working");
  }
  // return Buckets;
};

exports.S3Upload = async (fileName, folder) => {
  const fileStream = fs.readFileSync(`${base}/${folder}/${fileName}`);
  const key = `${folder}/${fileName}`;
  const command = new s3.PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: fileStream,
    ACL: "public-read",
    ContentDisposition: "inline",
    ContentType: mime.contentType(fileName),
  });
  const data = await client.send(command);
  return `https://${bucket}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${key}`;
};
