import {
  Component,
  OnInit,
  OnDestroy,
  PLATFORM_ID,
  Injector,
  Inject
} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {UserService} from '../shared/user.service';
import {Subscription, Subject} from 'rxjs';
import {NavService} from '../shared/nav.service';
import {NgbDropdownConfig, NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {debounceTime} from 'rxjs/operators';
import {isPlatformBrowser} from '@angular/common';

@Component({
  selector: 'app-nav-bar',
  templateUrl: 'navbar.component.html',
  providers: [NgbDropdownConfig],
  styleUrls: ['navbar.component.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {
  hideLogin: boolean;
  userGivenName: string;
  login = true;
  loginErr = 'Invalid email and or password.';
  cart = 0;
  subscription: Subscription;
  cartSubscription: Subscription;
  routeSubscription: Subscription;
  searchString: string;
  searchSubject: Subject<string> = new Subject();
  routeParam: Subscription;
  modalService;
  modalReference;
  isClient = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private userService: UserService,
    private navService: NavService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private injector: Injector
  ) {
    this.isClient = isPlatformBrowser(this.platformId);
    if (isPlatformBrowser(this.platformId)) {
      this.modalService = this.injector.get(NgbModal);
    }
  }

  ngOnInit() {
    this.loginSub();
    this.onLoginSuccess();
    this.cartSub();
    this.searchLaptop();
    this.registerSearch();
  }

  ngOnDestroy() {
    // prevent memory leak when component is destroyed
    this.subscription.unsubscribe();
    this.cartSubscription.unsubscribe();
    this.routeSubscription.unsubscribe();
    this.searchSubject.unsubscribe();
    this.routeParam.unsubscribe();
  }

  openLogin(content) {
    // this.modalReference = this.modalService.open(content);
    this.router.navigate(['login']);
  }

  openReg(content) {
    this.router.navigate(['register']);
  }

  registerSearch() {
    this.routeParam = this.route.queryParams.subscribe(params => {
      if (params.search) {
        this.searchString = params.search;
      }
    });
  }

  searchLaptop() {
    this.searchSubject.pipe(debounceTime(300)).subscribe(search => {
      const searchString = search;
      let param = {};
      if (searchString) {
        param = {
          search
        };
      } else {
        param = {
          refresh: true
        };
      }
      this.router.navigate([''], {
        queryParams: param
      });
    });
  }

  submit(inputElement: HTMLElement) {
    this.searchSubject.next(this.searchString || '');
    inputElement.blur();
  }

  cartSub() {
    this.cartSubscription = this.navService.navCart$.subscribe(newValue => {
      this.cart = newValue;
    });
  }


  loginSub() {
    this.subscription = this.navService.navLogin$.subscribe(
      isLoggedIn => {
        if (isLoggedIn) {
          this.onLoginSuccess();
        } else {
          this.onLogout();
        }
      },
      error => console.error(error)
    );
  }

  onLoginSuccess() {
    const user = this.userService.getUser();
    if (user) {
      this.userGivenName = user.name;
      this.hideLogin = true;
    }
  }

  onLogout() {
    const user = this.userService.getUser();
    if (!user) {
      this.userGivenName = null;
      this.hideLogin = false;
    }
  }

  localAuth(email, password) {
    if (email && password) {
      this.userService.login(email, password).subscribe(response => {
        if (response.success) {
          if (this.modalReference) {
            this.modalReference.close();
          }
          this.login = true;
        } else {
          this.loginErr = response.err;
          this.login = false;
        }
      });
    } else {
      this.login = false;
    }
  }

  sendLogout() {
    this.userService.logout().subscribe(
      () => {
        this.userGivenName = null;
        this.hideLogin = false;
        this.router.navigate(['/']);
      },
      error => console.error(error)
    );
  }
}
