import {Component, OnInit} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {NgbRatingConfig} from '@ng-bootstrap/ng-bootstrap';
import {Title} from '@angular/platform-browser';

@Component({
  selector: 'app-add-new',
  templateUrl: './add-new.component.html',
  styleUrls: ['./add-new.component.scss'],
  providers: [NgbRatingConfig]
})
export class AddNewComponent implements OnInit {
  operatingSystems = [
    'Scarfs',
    'Shoes',
    'Handbag',
    'Jewelries',
    'Dresses'
  ];
  processors = [
    'S',
    'M',
    'L',
    'XL',
    'XXL'
  ];
  brands = [
    'Decoration',
    'Accessories',
    'Clothes',
    'Gifts',
    'Wallets',
    'Bags',
    'Furniture',
    'Crochet'
  ];
  storageTypes = ['Men', 'Women'];
  // initialize default laptop options
  defaultOptions = {
    title: '',
    image: '',
    ram: null,
    storage: null,
    description: ['', '', '', ''],
    os: null,
    processor: null,
    storageType: null,
    brand: null,
    limit: false,
    price: null,
    rating: null
  };
  laptop = Object.assign({}, this.defaultOptions);
  errorArr = new Array();
  errorText: string;
  imageErr = false;
  newLaptopId: string;

  constructor(
    private http: HttpClient,
    private ratingConfig: NgbRatingConfig,
    private titleService: Title
  ) {
    ratingConfig.max = 5;
    ratingConfig.readonly = false;
  }

  ngOnInit() {
    this.titleService.setTitle('Add new laptop');
  }

  trackByFn(index: any, item: any) {
    return index;
  }

  clearAll() {
    this.laptop = Object.assign({}, this.defaultOptions);
    // because Object.assign does not deep clone
    this.laptop.description = ['', '', '', ''];
    // Clear Errors
    this.errorArr = [];
    this.updateErrorText();
  }

  addDescription() {
    if (this.laptop.description.length < 8) {
      this.laptop.description.push('');
      this.laptop.limit = false;
    } else {
      this.laptop.limit = true;
    }
  }

  removeDescription(index: any) {
    if (this.laptop.description.length > 1) {
      this.laptop.limit = false;
      this.laptop.description.splice(index, 1);
    }
  }

  updateErrorText() {
    this.errorText = this.errorArr.join(', ');
  }

  imageError() {
    this.imageErr = true;
    if (!this.errorArr.includes('Image URL')) {
      this.errorArr.push('Image URL');
      this.updateErrorText();
    }
  }

  imageLoad() {
    this.imageErr = false;
    const index = this.errorArr.indexOf('Image URL');
    if (index !== -1) {
      this.errorArr.splice(index, 1);
    }
    if (this.errorArr.length === 0) {
      this.errorText = null;
    } else {
      this.updateErrorText();
    }
  }

  submit(): void {
    // if (!this.imageErr && this.laptop.image) {
    const headers = new HttpHeaders({
      Accept: 'application/json',
      'Content-Type': 'application/json'
    });
    const apiUrl = '/api/user/laptop';
    console.log(this.laptop);
    this.http
      .post(apiUrl, {laptop: this.laptop}, {headers: headers})
      .toPromise()
      .then((res: { id: string }) => {
        this.newLaptopId = res.id;
        this.clearAll();
        window.scrollTo(0, 0);
      })
      .catch(err => {
        this.errorArr = err.errors;
        this.updateErrorText();
        window.scrollTo(0, 0);
      });

  }
}
