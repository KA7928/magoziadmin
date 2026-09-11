import { NextResponse } from "next/server";
import crypto from "crypto";

const SERVICE_ACCOUNT = {
  type: "service_account",
  project_id: "magoziproject",
  private_key_id: "bc2a09d9090298721295b9fd771060b5f29d8399",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDpHeusEwdCnMP9\nyO7w5VqvnTScpX4nhqpOpt32CdVya+u8YOf+DPYQxXUMdGrrfW61vOTHYNT+q/i5\nWXwY/BQH5UxBHEqpTIvXUITFgFgSd+Yk2odSS4EvRoiw2VebtHOY3dP9ycZrDO6w\nhoXBePmHcgIFNbiYGrbz0BiQ+9HfWrKxXr1sjHg3kJ0ASRO+VAskMq3IjZ3CmRK5\n1HkXSEmcgT90MUb3Y2ADTNhmFVbEx7DcvZxMqjES6M/o0PJWtDHj6hRNjGidqWZb\naCGmxMGKOpoquC6HmdcTeumw5KOOnxslXf3wrcyncEWPb67SMY/VEWYLtSEH43CL\nvmwTYgzfAgMBAAECggEACN9l3buVRlvHhrYXIhdL4SAPci1HJL0wNKSO3izecU4N\ncuYQiALf4SBWDCgbybEq4/ZRXtiFdgv/M4H/m/o8Nb2GFK3wlldrgY52/zo07L8G\nuD0sP8QDIe5O7yw89JgxrifQFPpd3iubCiAuOk1SC6Dmb5XtdYMB/TwQABsVkEKs\nFDH2ydhIRQdv9AqyiUzOdHP1HPYVrB9ToEFbsgOlAKKd+wriRemNXlNzt1HAWIA+\n31AKuGVy6TYUx8n8/rNvtyfcYBj6V/uaX97IZ6olD8WJtEze7bRMULIPEE8F3uGf\njAE56Fg/zCj7Nd9L01IJ0sPEENYhp21RmQyyjZ+xQQKBgQD4+HKpAeoYQhI63pkN\n9UHBl0xf8t+fiLtbf4ly4g1T/E+9mks/P7iLAL67EwJwmIlr9eqIDXtistbtiw9k\nyB1ZbJXLbela1KnajxRwKceQq3Qwmsk4Rb5FwhxMksoJ3Cv81QNPPLx6k+D6G1uq\ng91X/yrtmy10mcGBunaxIP+jewKBgQDvsuIV1PjcDC83aK6GxVyy17Hs25dj+PvK\npaqEIzw1uF74fDYcU2+1fpyvBVXEHWdiqyoQlto6ZbcehUrVFLPonvJiAGv1ODak\nZrpLgqOKfsZs0mtts1KTRLpuPVXm7PWpJhLPOBKj5Fon8CBSh1022ZiXfsE4F91a\nYHrr+I7c7QKBgQDjWsYiLfxfEJ7jIXk1NN1Kcuasy/aIEe29/XY/8cvoAQW0iBzk\n8kSMsy55WT+mILWFYDk+6sjc9aGtpIp3JwMeMTmNXp51crR1QKmST6TNKLTe2cqc\n15uMyljbWESlwmhs5vyxtC4N5dLRsn//85EClaLW/hkBXJNH60YONKsd1wKBgQCS\njPcny/d/aj+wC+Ow6JgdjDzviO7No9wmcRWJBpX4bko6eI8I0IabG9cmNwfSCPw9\n2lK0o9a3H5tPIMW485hvoEanXoSjAASAjYJXSn883PfqbthZ0OqqubmWTw/nSXeF\nPI8BfNIAvEvW4TyR2MtIDs/5x/jQl96xNA3TmjuWnQKBgQDAwZ+njV0BhPbPn8i2\nGKSe3CjZ6mZjfiNHJ1hoS2Pbl/3b7koQ8qgo9Ah4CXGTV0OLjWaV1yuT2JHEYs2z\nyUwZWeBu2nm2VpMP7KOpC1+G57EOJLzUtJDCEI2nDIi626iBhoestQ+EuSvszqmV\nTPXLSZ0X3fFVfx3LT3Af6Th/Dw==\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-fbsvc@magoziproject.iam.gserviceaccount.com",
};

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

async function getGoogleAccessToken(): Promise<string> {
  const header = JSON.stringify({ alg: "RS256", typ: "JWT" });
  const now = Math.floor(Date.now() / 1000);
  const claimSet = JSON.stringify({
    iss: SERVICE_ACCOUNT.client_email,
    sub: SERVICE_ACCOUNT.client_email,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
  });

  const signatureInput = `${base64UrlEncode(header)}.${base64UrlEncode(claimSet)}`;

  const signer = crypto.createSign("RSA-SHA256");
  signer.update(signatureInput);
  const signature = signer
    .sign(SERVICE_ACCOUNT.private_key, "base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const jwt = `${signatureInput}.${signature}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    throw new Error(`Google OAuth Token Error: ${JSON.stringify(tokenData)}`);
  }
  return tokenData.access_token;
}

export async function POST(req: Request) {
  try {
    const { title, body, targetAudience } = await req.json();

    if (!title || !body) {
      return NextResponse.json(
        { success: false, error: "Title and body are required." },
        { status: 400 }
      );
    }

    const topic = targetAudience === "Active Buyers" ? "active_buyers" : "all_users";

    // 1. Generate Google OAuth2 Access Token for FCM v1 API
    const accessToken = await getGoogleAccessToken();

    // 2. Dispatch Push Notification via FCM HTTP v1 REST API
    const fcmRes = await fetch(
      `https://fcm.googleapis.com/v1/projects/${SERVICE_ACCOUNT.project_id}/messages:send`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          message: {
            topic: topic,
            notification: {
              title: title,
              body: body,
            },
            data: {
              click_action: "FLUTTER_NOTIFICATION_CLICK",
              title: title,
              body: body,
              sentAt: new Date().toISOString(),
            },
            android: {
              priority: "high",
              notification: {
                sound: "default",
                channelId: "magozi_orders_channel",
              },
            },
          },
        }),
      }
    );

    const fcmResult = await fcmRes.json();

    if (fcmRes.ok && fcmResult.name) {
      return NextResponse.json({
        success: true,
        sentToFcm: true,
        messageId: fcmResult.name,
        topic,
        message: `🎉 Successfully dispatched Push Notification to FCM topic /topics/${topic}! Google Message ID: ${fcmResult.name}`,
      });
    } else {
      console.warn("FCM v1 API error response:", fcmResult);
      return NextResponse.json({
        success: true,
        sentToFcm: false,
        fcmError: fcmResult,
        message: "Saved in Firestore, but FCM API returned an error.",
      });
    }
  } catch (error: any) {
    console.error("Error in FCM send-notification API route:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process notification." },
      { status: 500 }
    );
  }
}
