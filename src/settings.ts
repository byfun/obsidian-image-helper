import { App, PluginSettingTab, Setting } from "obsidian";

import ImageHelper from "./main";

export class ICSettingTab extends PluginSettingTab {
	plugin: ImageHelper;

	constructor(app: App, plugin: ImageHelper) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Quality")
			.setDesc(`image quality (1.0 is the best quality).`)
			.addDropdown((toggle) =>
				toggle
					.addOptions({
						"0.1": "0.1",
						"0.15": "0.15",
						"0.2": "0.2",
						"0.25": "0.25",
						"0.3": "0.3",
						"0.35": "0.35",
						"0.4": "0.4",
						"0.45": "0.45",
						"0.5": "0.5",
						"0.55": "0.55",
						"0.6": "0.6",
						"0.65": "0.65",
						"0.7": "0.7",
						"0.75": "0.75",
						"0.8": "0.8",
						"0.85": "0.85",
						"0.9": "0.9",
						"0.95": "0.95",
						"1.0": "1.0",
					})
					.setValue(this.plugin.settings.quality)
					.onChange(async (value) => {
						this.plugin.settings.quality = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("X offset")
			.setDesc("x offset value as number from mouse click point")
			.addText((text) =>
				text
					.setValue(this.plugin.settings.offset_x)
					.onChange(async (value) => {
						this.plugin.settings.offset_x = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Y offset")
			.setDesc("y offset value as number from mouse click point")
			.addText((text) =>
				text
					.setValue(this.plugin.settings.offset_y)
					.onChange(async (value) => {
						this.plugin.settings.offset_y = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Use converting to jpg")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.use_jpg)
					.onChange((value) => {
						this.plugin.settings.use_jpg = value;
						this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("Use converting to webp")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.use_webp)
					.onChange((value) => {
						this.plugin.settings.use_webp = value;
						this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("Use converting to png")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.use_png)
					.onChange((value) => {
						this.plugin.settings.use_png = value;
						this.plugin.saveSettings();
					});
			});
	}
}
