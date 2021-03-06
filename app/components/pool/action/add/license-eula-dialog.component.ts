import { Component } from "@angular/core";
import { MdDialogRef } from "@angular/material";

import { ApplicationLicense } from "app/models";
import { ElectronShell } from "app/services";

@Component({
    selector: "bl-license-eula-dialog",
    templateUrl: "license-eula-dialog.html",
})
export class LicenseEulaDialogComponent {
    public license: ApplicationLicense;

    constructor(
        public dialogRef: MdDialogRef<LicenseEulaDialogComponent>,
        private electronShell: ElectronShell) {
    }

    public get isAutodesk(): boolean {
        return this.license && (this.license.id === "maya" || this.license.id === "arnold");
    }

    public get isVray(): boolean {
        return this.license && this.license.id === "vray";
    }

    public openLink(link: string) {
        this.electronShell.openExternal(link, {activate: true});
    }
}
