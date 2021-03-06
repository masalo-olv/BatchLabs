import { Component, Input } from "@angular/core";
import { JobHookTask } from "app/models";

import "./job-hook-task-details.scss";

@Component({
    selector: "bl-job-hook-task-details",
    templateUrl: "job-hook-task-details.html",
})
export class JobHookTaskDetailsComponent {
    @Input()
    public task: JobHookTask;

    @Input()
    public type: string = "preparationTask";

    public get currentFolder() {
        const info = this.task[this.type];
        return info && info.taskRootDirectory;
    }
}
