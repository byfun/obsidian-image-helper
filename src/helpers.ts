import { TFile, Notice } from "obsidian";

const DEBUG_MODE = false;
const LOAD_IMAGE_BLOB_TIMEOUT = 5000;
const NOTICE_TIMEOUT_INF = 500000;
const NOTICE_TIMEOUT = 1800;

export function dbg(...args: any[]) {
	if (DEBUG_MODE) {
		console.log.apply(console, ["[ImageHelper]", ...args]);
	}
}

/**
 *
 * @param file TFile image file object
 * @param src string image source
 * @param mime string mime type to save e.g. "image/jpeg", "image/png", "image/webp"
 * @param extension string file extension to save e.g. jpg, png, webp
 * @param quality number image quality
 */
export async function convertImage(
	file: TFile,
	src: string,
	mime: string,
	extension: string,
	quality: number
) {
	if (file == null) {
		dbg("convertImage() : given file is null ");
		return;
	}
	const originExtension = getExtension(src);
	const notice = new Notice("Converting image...", NOTICE_TIMEOUT_INF);
	try {
		const blob = await loadImageBlob(src);
		let arrayBuffer: ArrayBuffer = await doConvertImage(
			blob,
			mime,
			quality
		);
		notice.hide();

		if (arrayBuffer.byteLength > 0) {
			await this.app.vault.modifyBinary(file, arrayBuffer);

			const sourcePath: string = file.path;
			const newFilePath = sourcePath.replace(
				"." + originExtension,
				"." + extension
			);
			try {
				dbg(
					"convertImage() calls renameFile(): ",
					sourcePath,
					" to ",
					newFilePath
				);
				this.app.fileManager.renameFile(file, newFilePath);
			} catch (err) {
				new Notice(`Failed to rename ${newFilePath}: ${err}`);
				throw err;
			}

			new Notice("Image format changed", NOTICE_TIMEOUT);
		}
	} catch (e) {
		if (notice) {
			notice.hide();
		}
		console.log("Error, could not change the image!", e);
		new Notice(e, NOTICE_TIMEOUT);
		new Notice("Error, could not change the image!", NOTICE_TIMEOUT);
	}
}

/**
 * returns TFile object
 *
 * @param imgURL string image url
 * @returns TFile object from image url (internal link)
 */
export function getFileByName(imgURL: string): TFile | null {
	const fileBaseName = getBasename(decodeURIComponent(imgURL));
	if (fileBaseName == null || fileBaseName == "") {
		dbg("getFileByName() cannot get file basename");
		return null;
	}
	const resolvedLinks = app.metadataCache.resolvedLinks;
	for (const [mdFile, links] of Object.entries(resolvedLinks)) {
		for (const [filePath, nr] of Object.entries(links)) {
			if (filePath.includes(fileBaseName)) {
				try {
					const AttachFile =
						app.vault.getAbstractFileByPath(filePath);
					if (AttachFile instanceof TFile) {
						dbg("getFileByName() - found : ", filePath);
						return AttachFile;
					}
				} catch (error) {
					new Notice("cannot get the image file");
					console.error(error);
					return null;
				}
			}
		}
	}
	return null;
}

export function getBasename(fullpath: string): string {
	let fileBaseName = fullpath;
	if (fileBaseName.indexOf("/") >= 0) {
		fileBaseName = fileBaseName.substring(
			fileBaseName.lastIndexOf("/") + 1
		);
	}
	if (fileBaseName.indexOf("?") > 0) {
		fileBaseName = fileBaseName.substring(0, fileBaseName.indexOf("?"));
	}
	return fileBaseName;
}

/**
 * returns extension of a given file path without dot
 *
 * @param fullpath string path of file
 * @returns
 */
export function getExtension(fullpath: string): string {
	let filename = getBasename(fullpath);
	if (filename.indexOf("?") > 0) {
		filename = filename.substring(0, filename.indexOf("?"));
	}
	if (filename.indexOf(".") > 0) {
		filename = filename
			.substring(filename.lastIndexOf(".") + 1)
			.toLowerCase();
	}
	return filename;
}

/**
 *
 * @source https://github.com/musug/obsidian-paste-png-to-jpeg/blob/main/src/utils.ts
 *
 * @param file
 * @param mime
 * @param quality
 * @returns
 */
function doConvertImage(
	file: Blob,
	mime: string,
	quality: number
): Promise<ArrayBuffer> {
	return new Promise((resolve, reject) => {
		let reader = new FileReader();
		reader.onloadend = function (e) {
			if (e.target == null || e.target.result == null) {
				return;
			}
			let image = new Image();
			image.onload = function () {
				let canvas = document.createElement("canvas");
				let context = canvas.getContext("2d");
				let imageWidth = image.width;
				let imageHeight = image.height;
				let data = "";

				canvas.width = imageWidth;
				canvas.height = imageHeight;

				if (context !== null) {
					context.fillStyle = "#fff";
					context.fillRect(0, 0, imageWidth, imageHeight);
					context.save();

					context.translate(imageWidth / 2, imageHeight / 2);
					context.drawImage(
						image,
						0,
						0,
						imageWidth,
						imageHeight,
						-imageWidth / 2,
						-imageHeight / 2,
						imageWidth,
						imageHeight
					);
					context.restore();
				}

				data = canvas.toDataURL(mime, quality);
				if (!data || data == "data:,") {
					reject(new Error("Image size might be too big!!"));
				}
				let arrayBuffer: ArrayBuffer | null = null;
				try {
					arrayBuffer = base64ToArrayBuffer(data);
					resolve(arrayBuffer);
				} catch (e) {
					reject(e);
				}
			};

			image.src = e.target.result.toString();
		};

		reader.readAsDataURL(file);
	});
}

/**
 * @source https://github.com/musug/obsidian-paste-png-to-jpeg/blob/main/src/utils.ts
 *
 * @param code string
 * @returns ArrayBuffer
 */
function base64ToArrayBuffer(code: string): ArrayBuffer {
	const parts = code.split(";base64,");
	const raw = window.atob(parts[1]);
	const rawLength = raw.length;
	const uInt8Array = new Uint8Array(rawLength);
	for (let i = 0; i < rawLength; ++i) {
		uInt8Array[i] = raw.charCodeAt(i);
	}
	return uInt8Array.buffer;
}

/**
 *
 * @source https://github.com/NomarCub/obsidian-copy-url-in-preview/blob/master/src/helpers.ts
 * @param imgSrc
 * @returns
 */
async function loadImageBlob(imgSrc: string): Promise<Blob> {
	const loadImageBlobCore = () => {
		return new Promise<Blob>((resolve, reject) => {
			const image = new Image();
			image.crossOrigin = "anonymous";
			image.onload = () => {
				const canvas = document.createElement("canvas");
				canvas.width = image.width;
				canvas.height = image.height;
				const ctx = canvas.getContext("2d")!;
				ctx.drawImage(image, 0, 0);
				canvas.toBlob((blob: Blob) => {
					resolve(blob);
				});
			};
			image.onerror = () => {
				reject();
			};
			image.src = imgSrc;
		});
	};
	return withTimeout(LOAD_IMAGE_BLOB_TIMEOUT, loadImageBlobCore());
}

function withTimeout<T>(ms: number, promise: Promise<T>): Promise<T> {
	const timeout = new Promise((resolve, reject) => {
		const id = setTimeout(() => {
			clearTimeout(id);
			reject(`timed out after ${ms} ms`);
		}, ms);
	});
	return Promise.race([promise, timeout]) as Promise<T>;
}
