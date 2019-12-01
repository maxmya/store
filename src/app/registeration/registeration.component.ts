import {Component, OnInit} from '@angular/core';
import {UserService} from '../shared/user.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-registeration',
  templateUrl: './registeration.component.html',
  styleUrls: ['./registeration.component.scss']
})
export class RegisterationComponent implements OnInit {

  login = true;
  loginErr = 'Invalid email and or password.';

  constructor(private userService: UserService,
              private router: Router) {
  }

  ngOnInit() {
  }

  registerUser(value: string, value2: string) {

    if (value && value2) {
      const obj = {
        username: value,
        password: value2
      };

      this.userService.registerUser(obj).subscribe(
        data => {
          if (data.success) {
            this.router.navigate(['login']);
          } else {
            this.loginErr = data.error;
            this.login = false;
          }
        }
      );
    } else {
      this.loginErr = 'please fill data';
      this.login = false;
    }
  }
}
