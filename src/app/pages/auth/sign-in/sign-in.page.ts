import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { NgForm } from '@angular/forms';
import { SubSink } from 'subsink';

import { AuthService } from 'src/app/services/account/auth';
import { ProfileService } from 'src/app/services/account/profile';
import { NotificationService } from 'src/app/services/support/notification';

import { environment } from 'src/environments/local';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.page.html',
  styleUrls: ['./sign-in.page.scss'],
})
export class SignInPage implements OnInit, OnDestroy {
  private subs = new SubSink();

  password: any = '';
  email: any = '';
  returnUrl: string;

  showPass = false;
  error = false;

  cloudUrl = environment.cloudUrl;
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private profileService: ProfileService,
    private notificationService: NotificationService
  ) { }

  ngOnInit() {
    this.returnUrl = this.route.snapshot.queryParams.returnUrl || '/';
  }

  signIn(form: NgForm) {
    if (!form.valid) { return; }
    this.subs.sink = this.authService.signIn(this.email, this.password).subscribe(res => {
      this.error = false;
      if (this.returnUrl === '/') {
        this.router.navigate(['/home']);
      } else {
        this.router.navigate([`${this.returnUrl}`]);
      }
      // this.subs.sink = this.profileService.bootLoader().subscribe(data => {
      //   this.notificationService.listen(data.user);
      // });
    }, err => {
      this.error = true;
    });
  }

  navigate(url: string) {
    if (this.returnUrl === '/') {
      this.router.navigate([`/auth/${url}`]);
    } else {
      this.router.navigate([`/auth/${url}`], { queryParams: { returnUrl: this.returnUrl } });
    }
  }

  showPassword() {
    this.showPass = !this.showPass;
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
