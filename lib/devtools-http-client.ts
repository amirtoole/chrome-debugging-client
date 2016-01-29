import * as http from "http";

export interface HTTPOptions {
  host?: string;
  port?: number;
}

export interface Tab {
  description: string;
  devtoolsFrontendUrl: string;
  faviconUrl?: string;
  id: string;
  title: string;
  type: string;
  url: string;
  webSocketDebuggerUrl: string;
}

export interface Version {
  Browser: string,
  "Protocol-Version": string;
  "User-Agent": string;
  "WebKit-Version": string;
}

export class HTTPError extends Error {
  statusCode: number;
  constructor(statusCode: number, body: string) {
    super(body);
    this.statusCode = statusCode;
  }
}

function httpGet(host: string, port: number, path: string): Promise<http.IncomingMessage> {
  return new Promise<http.IncomingMessage>((resolve, reject) => {
    http.get({
      host: host, port: port, path: path
    }, resolve).once("error", reject);
  });
}

function readBody(res: http.IncomingMessage): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    let body = "";
    res.setEncoding("utf8");
    res.on("readable", () => {
      body += res.read();
    });
    res.once("error", reject);
    res.on("end", () => {
      resolve(body);
    });
  });
}

export default class DevToolsHTTPClient {
  host: string;
  port: number;

  constructor(options?: HTTPOptions) {
    this.host = options && options.host || "localhost";
    this.port = options && options.port || 9222;
  }

  async get(path: string): Promise<string> {
    let res = await httpGet(this.host, this.port, path);
    let body = await readBody(res);
    if (res.statusCode !== 200) {
      throw new HTTPError(res.statusCode, body);
    }
    return body;
  }

  async list(): Promise<Tab[]> {
    let body = await this.get("/json/list");
    return <Tab[]>JSON.parse(body);
  }

  async new(url?: string): Promise<Tab> {
    let path = "/json/new";
    if (url) {
      path += "?" + encodeURIComponent(url);
    }
    let body = await this.get(path);
    return <Tab>JSON.parse(body);
  }

  async activate(tabId: string): Promise<string> {
    let path = "/json/activate/" + tabId;
    let body = await this.get(path);
    return body;
  }

  async close(tabId: string): Promise<string> {
    let path = "/json/close/" + tabId;
    let body = await this.get(path);
    return;
  }

  async version(): Promise<Version> {
    let body = await this.get("/json/version");
    return <Version>JSON.parse(body);
  }
}