import {
  Component,
  OnInit,
  OnDestroy,
  Inject,
  PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { NgbRatingConfig } from '@ng-bootstrap/ng-bootstrap';
import { NotificationsService } from 'angular2-notifications';
import { Title } from '@angular/platform-browser';
import { ProductService } from './product.service';

@Component({
  selector: 'app-product',
  templateUrl: 'product.component.html',
  providers: [ProductService, NgbRatingConfig, NotificationsService],
  styleUrls: ['product.component.scss']
})
export class ProductComponent implements OnInit, OnDestroy {
  product = [];
  similar: Array<Object>;
  param: any;
  id: any;
  currentQuantity = 1;
  options = {
    position: ['top', 'right'],
    timeOut: 4000,
    lastOnBottom: true,
    pauseOnHover: true,
    clickToClose: true,
    maxLength: 0
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private config: NgbRatingConfig,
    private toastService: NotificationsService,
    private titleService: Title,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    config.max = 5;
    config.readonly = true;
  }

  ngOnInit() {
    // subscribe to route to get product ID
    this.param = this.route.params.subscribe(params => {
      if (isPlatformBrowser(this.platformId)) {
        // browser scrolls to top when route param changes
        window.scrollTo(0, 0);
      }

      this.id = params['id'];
      this.getById(this.id);
    });
  }

  popToast(isTrue, quantity) {
    if (isTrue) {
      this.toastService.success(
        `${quantity} Added`,
        `${this.product[0]['laptop_name'].substring(0, 40)}...`
      );
    } else {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: `/product/${this.id}` }
      });
    }
  }

  popToastInvalid(header, subject) {
    this.toastService.info(header, subject, {
      timeOut: 3000
    });
  }

  getById(id: any) {
    this.productService.getProductById(id).subscribe(
      response => {
        this.currentQuantity = 1;
        this.product = response.product;
        this.similar = response.similar;
        this.titleService.setTitle(`${this.product[0]['laptop_name']}`);
      },
      error => {
        if (error) this.router.navigate(['404']);
      }
    );
  }

  addToCart(id, qty) {
    const quantity = parseInt(qty, 10) || 0;
    if (quantity <= 0) {
      this.popToastInvalid('Missing Quantity', 'Did you mean to add 1?');
    } else if (quantity > 20) {
      this.popToastInvalid('Too many added', 'Limit of 20 per customer!');
    } else {
      this.productService.addToCart(id, quantity).subscribe(
        response => {
          if (response) {
            window.scrollTo(0, 0);
            this.popToast(true, quantity);
          } else {
            this.popToastInvalid('Missing Quantity', 'Did you mean to add 1?');
          }
        },
        error => {
          window.scrollTo(0, 0);
          if (error) this.popToast(false, null);
        }
      );
    }
  }

  ngOnDestroy() {
    // prevent memory leaks
    this.param.unsubscribe();
  }
}
