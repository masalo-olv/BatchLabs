import { Component, Input } from "@angular/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import { autobind } from "core-decorators";

import { AddNodeUserAttributes } from "app/services";

export enum CredentialsMode {
    Password,
    SSHPublicKey,
}

@Component({
    selector: "bl-node-user-credentials-form",
    templateUrl: "node-user-credentials-form.html",
})
export class NodeUserCredentialsFormComponent {
    public CredentialsMode = CredentialsMode;

    @Input()
    public set isLinuxNode(value: boolean) {
        this._isLinuxNode = value;
        if (value) {
            this.form.patchValue({
                mode: CredentialsMode.SSHPublicKey,
            });
        }
    }
    public get isLinuxNode() { return this._isLinuxNode; }

    @Input()
    public submit: (credentials) => any;

    public form: FormGroup;

    private _isLinuxNode: boolean;

    constructor(formBuilder: FormBuilder) {
        this.form = formBuilder.group({
            username: [""],
            mode: [CredentialsMode.Password],
            password: [""],
            sshPublicKey: [""],
            isAdmin: [true],
        });
    }

    @autobind()
    public submitForm() {
        const value = this.form.value;
        const credentials: AddNodeUserAttributes = {
            name: value.username,
            isAdmin: value.isAdmin,
        };
        if (value.mode === CredentialsMode.SSHPublicKey) {
            credentials.sshPublicKey = value.sshPublicKey;
        } else {
            credentials.password = value.password;
        }
        return this.submit(credentials);
    }

    public get useSSHKey() {
        return this.form.value.mode === CredentialsMode.SSHPublicKey;
    }
}
