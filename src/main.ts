import { Menu, MenuItem, Plugin, Platform } from "obsidian";

import { getFileByName, getExtension, convertImage, dbg } from "./helpers";

import { ICSettingTab } from "./settings";

interface Listener {
	(this: Document, ev: Event): any;
}

interface ImageHelperSettings {
	quality: string;
	offset_x: string;
	offset_y: string;
	use_jpg: boolean;
	use_webp: boolean;
	use_png: boolean;
}

const DEFAULT_SETTINGS: ImageHelperSettings = {
	quality: "0.8",
	offset_x: "0",
	offset_y: "0",
	use_jpg: true,
	use_webp: true,
	use_png: false,
};

export default class ImageHelper extends Plugin {
	longTapTimeoutId: number | null = null;
	settings: ImageHelperSettings;

	async onload() {
		await this.loadSettings();
		if (Platform.isDesktop) {
			this.register(
				this.onElement(
					document,
					"contextmenu" as keyof HTMLElementEventMap,
					"img",
					this.onClick.bind(this)
				)
			);
		}
		this.addSettingTab(new ICSettingTab(this.app, this));
	}

	onunload() {}

	onClick(event: MouseEvent) {
		event.preventDefault();
		const target = event.target as Element;
		const imgType = target.localName;
		const menu = new Menu();
		switch (imgType) {
			case "img": {
				const image = (target as HTMLImageElement).currentSrc;
				const originExtension = getExtension(image);
				const url = new URL(image);
				const protocol = url.protocol;
				let file = getFileByName(image);
				dbg("Clicked Image : ", file ? file.path : "NULL");
				switch (protocol) {
					case "app:":
					case "data:":
						if (
							this.settings.use_jpg &&
							originExtension !== "jpg" &&
							originExtension !== "jpeg"
						) {
							menu.addItem((item: MenuItem) =>
								item
									.setIcon("image-file")
									.setTitle("convert to jpeg image")
									.setChecked(true)
									.onClick(async () => {
										if (file == null) {
											return;
										}
										convertImage(
											file,
											image,
											"image/jpeg",
											"jpg",
											Number(this.settings.quality)
										);
									})
							);
						}

						if (
							this.settings.use_webp &&
							originExtension !== "webp"
						) {
							menu.addItem((item: MenuItem) =>
								item
									.setIcon("image-file")
									.setTitle("convert to webp image")
									.setChecked(true)
									.onClick(async () => {
										if (file == null) {
											return;
										}
										convertImage(
											file,
											image,
											"image/webp",
											"webp",
											Number(this.settings.quality)
										);
									})
							);
						}

						if (
							this.settings.use_png &&
							originExtension !== "png"
						) {
							menu.addItem((item: MenuItem) =>
								item
									.setIcon("image-file")
									.setTitle("convert to png image")
									.setChecked(true)
									.onClick(async () => {
										if (file == null) {
											return;
										}
										convertImage(
											file,
											image,
											"image/png",
											"png",
											Number(this.settings.quality)
										);
									})
							);
						}

						break;
					default:
						return;
				}
				break;
			}
			default:
				return;
		}
		menu.showAtPosition({
			x: event.pageX + parseInt(this.settings.offset_x),
			y: event.pageY + parseInt(this.settings.offset_y),
		});
		this.app.workspace.trigger("image-contextmenu:contextmenu", menu);
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	onElement(
		el: Document,
		event: keyof HTMLElementEventMap,
		selector: string,
		listener: Listener,
		options?: { capture?: boolean }
	) {
		el.on(event, selector, listener, options);
		return () => el.off(event, selector, listener, options);
	}
}
