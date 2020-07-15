import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { NbDialogRef } from '@nebular/theme';
import { SubSink } from 'subsink';
import { ProjectService } from 'src/app/services/project/project';
import { CollectionService } from 'src/app/services/project/collection';
import { UploadService } from 'src/app/services/project/upload';

@Component({
  selector: 'app-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.scss'],
})
export class SummaryComponent implements OnInit, OnDestroy {
  @Input() list: any;
  @Input() file?: any;
  @Input() type?: any;
  @Input() comment?: string;
  private subs = new SubSink();

  projectId: any;
  curColUuid: string;
  title = 'Selected Files';
  sections = ['music', 'video', 'merch', 'other'];
  discards: any;

  constructor(
    protected dialogRef: NbDialogRef<any>,
    private activatedRoute: ActivatedRoute,
    private projectService: ProjectService,
    private collectionService: CollectionService,
    public uploadService: UploadService,
  ) { }

  ngOnInit() {
    console.log(this.list);
    this.subs.sink = this.activatedRoute.queryParams.subscribe(queryParams => {
      this.curColUuid = queryParams.version;
    });
    this.subs.sink = this.projectService.watchProjectInfo().subscribe(project => {
      this.projectId = project.project_uuid;
    });
    if (this.file) {
      this.list = { music: [], video: [], merch: [], other: [] };
      this.list[this.file.file_category].push(this.file);
    }
    if (this.type == 'view') {
      this.title = 'Selected Files';
    }
    if (this.type == 'summary') {
      this.title = 'Summary';
    }
    if (this.type == 'download') {
      this.title = 'Download Files';
    }
    this.discards = this.uploadService.discards;
  }

  close() {
    this.dialogRef.close();
  }

  submit() {
    console.log(this.list);
    const files = [...this.list.music, ...this.list.video, ...this.list.merch, ...this.list.other];
    this.subs.sink = this.uploadService.uploadCollectionFileConfirm(this.projectId, files, this.comment, this.uploadService.fileName).subscribe(result => {
      console.log({jobInfo: result});
      if (this.uploadService.isZip) {
        this.uploadService.job = result;
        this.dialogRef.close({ action: 'submit' });
      } else {
        this.subs.sink = this.projectService.getCollections(this.projectId).subscribe(col => {
          this.dialogRef.close({
            collections: col,
            newUuid: result.collection_uuid
          });
        });
      }
    });
  }

  download() {
    const files = [...this.list.music, ...this.list.video, ...this.list.merch, ...this.list.other];
    this.subs.sink = this.collectionService.downloadFiles(this.curColUuid, files).subscribe(jobInfo => {
      console.log({jobInfo});
      this.uploadService.job = jobInfo;
      this.dialogRef.close({
        action: 'download'
      });
    });
  }
  clear() {
    this.list = {
      music: [],
      video: [],
      merch: [],
      other: []
    };
    this.collectionService.clearCheckedList();
    this.dialogRef.close();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
