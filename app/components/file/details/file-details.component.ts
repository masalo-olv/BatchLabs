import { Component, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { autobind } from "core-decorators";
import { remote } from "electron";
import { Subscription } from "rxjs";

import { NotificationService } from "app/components/base/notifications";
import { File, ServerError } from "app/models";
import { ElectronShell, FileService, StorageService } from "app/services";
import { RxEntityProxy } from "app/services/core";
import { FileLoader } from "app/services/file";
import { FileUrlUtils, StorageUtils, prettyBytes } from "app/utils";

@Component({
    selector: "bl-file-details",
    templateUrl: "file-details.html",
})
export class FileDetailsComponent implements OnInit, OnDestroy {
    public static breadcrumb({ filename }) {
        return { name: filename, label: "File", invertName: true };
    }

    public jobId: string;
    public taskId: string;
    public nodeId: string;
    public poolId: string;
    public url: string;
    public filename: string;
    public contentSize: string;
    public downloadEnabled: boolean;
    public outputKind: string;
    public container: string;

    public fileLoader: FileLoader = null;
    public fileData: RxEntityProxy<any, File>;

    private _sourceType: string;
    private _paramsSubscribers: Subscription[] = [];

    constructor(
        private route: ActivatedRoute,
        private fileService: FileService,
        private shell: ElectronShell,
        private notificationService: NotificationService,
        private storageService: StorageService) {
        this.downloadEnabled = true;
    }

    public ngOnInit() {
        this._paramsSubscribers.push(this.route.data.subscribe((data) => {
            this._sourceType = data["type"];
        }));

        this._paramsSubscribers.push(this.route.params.subscribe((params) => {
            this.jobId = params["jobId"];
            this.taskId = params["taskId"];
            this.poolId = params["poolId"];
            this.nodeId = params["nodeId"];
            this.outputKind = params["outputKind"];
            this.container = params["container"];
            this.filename = params["filename"];
            this._clearFileLoader();
            this._setupFileLoader();
        }));
    }

    public ngOnDestroy() {
        this._paramsSubscribers.forEach(x => x.unsubscribe());
        this._clearFileLoader();
    }

    @autobind()
    public refresh() {
        return this.fileData.refresh();
    }

    @autobind()
    public downloadFile() {
        const dialog = remote.dialog;
        const localPath = dialog.showSaveDialog({
            buttonLabel: "Download",
            // Set default filename of file to download
            defaultPath: FileUrlUtils.getFileName(this.url),
        });

        if (localPath) {
            return this._saveFile(localPath);
        }
    }

    @autobind()
    public openExternal() {
        return this.fileLoader.cache().cascade((pathToFile) => {
            this.shell.openItem(pathToFile);
        });
    }

    public get isJobFile() {
        return this.jobId && this.taskId && !this.outputKind;
    }

    public get isPoolFile() {
        return this.poolId && this.nodeId;
    }

    public get isBlobFile() {
        return this.container || (this.jobId && this.taskId && this.outputKind);
    }

    private _setupFileLoader() {
        let obs: FileLoader;

        if (this.isJobFile) {
            obs = this.fileService.fileFromTask(this.jobId, this.taskId, this.filename);
        } else if (this.isPoolFile) {
            obs = this.fileService.fileFromNode(this.poolId, this.nodeId, this.filename);
        } else if (this.isBlobFile) {
            const prefix = !this.container ? `${this.taskId}/${this.outputKind}/` : null;
            const containerPromise = !this.container
                ? StorageUtils.getSafeContainerName(this.jobId)
                : Promise.resolve(this.container);

            obs = this.storageService.getBlobContent(containerPromise, this.filename, prefix);
        } else {
            throw new Error("Unrecognised source type: " + this._sourceType);
        }

        this.fileLoader = obs;
        this.fileData = this.fileLoader.listen();
        this.fileData.item.subscribe((file) => {
            if (!file) { return; }
            this.contentSize = prettyBytes(file.properties.contentLength);
            this.url = decodeURIComponent(file.url);
        });
    }

    private _saveFile(pathToFile) {
        if (pathToFile === undefined) {
            return;
        }
        const obs = this.fileLoader.download(pathToFile);
        obs.subscribe({
            next: () => {
                this.shell.showItemInFolder(pathToFile);
                this.notificationService.success("Download complete!", `File was saved locally at ${pathToFile}`);
            },
            error: (error: ServerError) => {
                this.notificationService.error(
                    "Download failed",
                    `${this.filename} failed to download. ${error.body.message}`,
                );
            },
        });

        return obs;
    }

    private _clearFileLoader() {
        if (this.fileLoader) {
            this.fileLoader.dispose();
            this.fileLoader = null;
        }
    }
}
