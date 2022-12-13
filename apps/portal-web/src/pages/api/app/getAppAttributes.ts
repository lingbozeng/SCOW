/**
 * Copyright (c) 2022 Peking University and Peking University Institute for Computing and Digital Economy
 * SCOW is licensed under Mulan PSL v2.
 * You can use this software according to the terms and conditions of the Mulan PSL v2.
 * You may obtain a copy of Mulan PSL v2 at:
 *          http://license.coscl.org.cn/MulanPSL2
 * THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
 * EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
 * MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
 * See the Mulan PSL v2 for more details.
 */

import { asyncUnaryCall } from "@ddadaal/tsgrpc-client";
import { status } from "@grpc/grpc-js";
import { authenticate } from "src/auth/server";
import { appCustomAttribute_AttributeTypeToJSON, AppServiceClient } from "src/generated/portal/app";
import { getClient } from "src/utils/client";
import { route } from "src/utils/route";
import { handlegRPCError } from "src/utils/server";

export interface SelectOption {
  value: string;
  label: string;
}

export interface AppCustomAttribute {
  type: "NUMBER" | "SELECT" | "TEXT";
  label: string;
  name: string;
  select: SelectOption[];
}

export interface GetAppAttributesSchema {
  method: "GET";

  query: {
    appId: string;
  }

  responses: {
    200: {
      appCustomFormAttributes: AppCustomAttribute[];
    };

    // appId not exists
    404: { code: "APP_NOT_FOUND" };
  }
}

const auth = authenticate(() => true);

export default /* #__PURE__*/route<GetAppAttributesSchema>("GetAppAttributesSchema", async (req, res) => {


  const info = await auth(req, res);

  if (!info) { return; }

  const { appId } = req.query;

  const client = getClient(AppServiceClient);


  return asyncUnaryCall(client, "getAppAttributes", {
    appId,
  }).then((reply) => {
    const attributes: AppCustomAttribute[] = [];
    reply.attributes.forEach((item) => {
      attributes.push({
        type: appCustomAttribute_AttributeTypeToJSON(item.type) as AppCustomAttribute["type"],
        label: item.label,
        name: item.name,
        select: item.options,
      });
    });
    return { 200: { appCustomFormAttributes: attributes } };
  }, handlegRPCError({
    [status.NOT_FOUND]: () => ({ 404: { code: "APP_NOT_FOUND" } } as const),
  }));

});