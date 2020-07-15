import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { SubSink } from 'subsink';

import { BreadcrumbService } from 'src/app/services/project/breadcrumb';
import { CollectionService } from 'src/app/services/project/collection';
import { ProjectService } from 'src/app/services/project/project';
import { PanelService } from 'src/app/services/shared/panel';

import { Project } from 'src/app/models/project';
import { BreadcrumbItem } from 'src/app/models/breadcrumbItem';

import * as _ from 'lodash';

@Component({
  selector: 'app-project',
  templateUrl: './project.page.html',
  styleUrls: ['./project.page.scss'],
})
export class ProjectPage implements OnInit, OnDestroy {
  private subs = new SubSink();
  projectID: number;
  projectInfo: Project;
  curColUuid: any;
  recColUuid: any;

  checkedList: any;

  currentTab: string;
  breadcrumb: BreadcrumbItem[] = [];


  constructor(
    private activatedRoute: ActivatedRoute,
    private modalController: ModalController,
    private router: Router,
    public breadcrumbService: BreadcrumbService,
    public collectionService: CollectionService,
    public projectService: ProjectService,
    private panelService: PanelService,
  ) { }

  ngOnInit() {
    this.subs.sink = this.activatedRoute.data.subscribe((data: any) => {
      this.projectInfo = data[0];
      this.projectService.setProjectInfo(this.projectInfo);
      this.watchProjectInfo();
      this.watchRouterParams();
    });
  }

  watchProjectInfo() {
    // Watch Recent Collection Uuid
    this.subs.sink = this.projectService.watchRecentCollectionUuid().subscribe(colUuid => {
      this.recColUuid = colUuid;
    })
    // Watch Checked Files List
    this.subs.sink = this.collectionService.watchCheckedList().subscribe(res => {
      this.checkedList = res;
    });
    // Watch Current Tab
    this.subs.sink = this.collectionService.watchCurrentTab().subscribe(res => {
      this.currentTab = res;
      if (!res) { this.currentTab = 'Info'; }
    });
    // Watch Current Breadcrumb
    this.subs.sink = this.breadcrumbService.getBreadcrumb().subscribe(res => {
      this.breadcrumb = res;
    });
  }

  watchRouterParams() {
    this.subs.sink = this.activatedRoute.queryParams.subscribe(queryParams => {
      this.curColUuid = queryParams.version ? queryParams.version : this.projectService.collectionUuid.value;
      this.updateCollectionItems(queryParams.version, queryParams.path);
    });
    this.subs.sink = this.activatedRoute.params.subscribe(routeParams => {
      this.projectID = routeParams.id;
      this.getProjectCollections(this.projectID, 1);
    });
  }

  getProjectCollections(projectUuid, page) {
    this.subs.sink = this.projectService.getCollections(projectUuid, page).subscribe(res => {
      const recentCol = res.data[0];
      this.projectService.collections.next(res);
      this.projectService.collectionUuid.next(recentCol.collection_uuid);
      console.log('collections', res);
    });
  }

  updateCollectionItems(collectionUuid, collectionPath) {
    if (!collectionUuid && !collectionPath) {
      this.breadcrumbService.initBreadcrumb();
      this.collectionService.setCurrentTab('Info');
      return;
    }
    if (!collectionUuid || !collectionPath) {
      this.router.navigate([]);
    }
    // parse tab and breadcrumb
    const pathParams = collectionPath.split('/').filter(value => value != '');
    // set tab
    if (pathParams[0] == 'Info') {
      this.router.navigate([]);
    }
    if (pathParams[0]) {
      this.collectionService.setCurrentTab(pathParams[0]);
    }
    // set breadcrumb
    this.breadcrumbService.initBreadcrumb();
    pathParams.forEach(element => {
      this.breadcrumbService.addBreadcrumbItem({ name: element });
    });
    this.collectionService.updateDataWithBreadcrumb(this.breadcrumb, collectionUuid);
  }

  setCollectionSection(tab) {
    if (!this.recColUuid) {
      // this.notificationService.showWarning('Collection', 'Please upload files');
      return;
    }
    this.collectionService.setCurrentTab(tab);
    this.currentTab = tab;
    if (tab == 'Info') {
      this.router.navigate([]);
      return;
    }
    this.breadcrumbService.initBreadcrumb(tab);
    this.router.navigate([], { queryParams: { version: this.curColUuid ? this.curColUuid : this.recColUuid, path: tab } });
  }

  uploadFiles() {
  }

  showHistoryBar() {
    this.panelService.showHistoryBar();
  }

  ionViewWillLeave() {
    this.projectInfo = new Project();
    this.curColUuid = '';
    this.currentTab = 'Info';
    this.projectService.initData();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
