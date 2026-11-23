import * as actions from "./social-media-graphics.actions";
import { callAction, type ActionData } from "./action-result";

export type * from "./social-media-graphics.actions";

export async function getSocialMediaGraphics(
  ...args: Parameters<typeof actions.getSocialMediaGraphics>
): Promise<ActionData<Awaited<ReturnType<typeof actions.getSocialMediaGraphics>>>> {
  return callAction(() => actions.getSocialMediaGraphics(...args));
}

export async function getSocialMediaGraphic(
  ...args: Parameters<typeof actions.getSocialMediaGraphic>
): Promise<ActionData<Awaited<ReturnType<typeof actions.getSocialMediaGraphic>>>> {
  return callAction(() => actions.getSocialMediaGraphic(...args));
}

export async function updateSocialMediaGraphic(
  ...args: Parameters<typeof actions.updateSocialMediaGraphic>
): Promise<ActionData<Awaited<ReturnType<typeof actions.updateSocialMediaGraphic>>>> {
  return callAction(() => actions.updateSocialMediaGraphic(...args));
}

export async function updateSocialMediaGraphicStatus(
  ...args: Parameters<typeof actions.updateSocialMediaGraphicStatus>
): Promise<ActionData<Awaited<ReturnType<typeof actions.updateSocialMediaGraphicStatus>>>> {
  return callAction(() => actions.updateSocialMediaGraphicStatus(...args));
}

export async function bulkUpdateSocialMediaGraphicStatus(
  ...args: Parameters<typeof actions.bulkUpdateSocialMediaGraphicStatus>
): Promise<
  ActionData<Awaited<ReturnType<typeof actions.bulkUpdateSocialMediaGraphicStatus>>>
> {
  return callAction(() => actions.bulkUpdateSocialMediaGraphicStatus(...args));
}

export async function deleteSocialMediaGraphic(
  ...args: Parameters<typeof actions.deleteSocialMediaGraphic>
): Promise<ActionData<Awaited<ReturnType<typeof actions.deleteSocialMediaGraphic>>>> {
  return callAction(() => actions.deleteSocialMediaGraphic(...args));
}

export async function deleteSocialMediaGraphicItem(
  ...args: Parameters<typeof actions.deleteSocialMediaGraphicItem>
): Promise<
  ActionData<Awaited<ReturnType<typeof actions.deleteSocialMediaGraphicItem>>>
> {
  return callAction(() => actions.deleteSocialMediaGraphicItem(...args));
}
