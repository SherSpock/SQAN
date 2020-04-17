import Vue from 'vue'
import VueRouter from 'vue-router'
import Signin from '../views/Signin.vue'
import About from '../views/About.vue'
import QCKeys from '../views/QCKeys.vue'
import TemplateSummary from '../views/TemplateSummary.vue'
import ResearchSummary from '../views/ResearchSummary.vue'
import Admin from '../views/Admin.vue'
import Profile from '../views/Profile.vue'
import Signout from '../views/Signout.vue'

import store from '../store';

Vue.use(VueRouter);

const router = new VueRouter({
  mode: 'history',
  routes: [
    {
      path: '/',
      name: 'signin',
      component: Signin,
      meta: {
        simple_layout: true
      }
    },
    {
      path: '/about',
      name: 'about',
      component: About
    },
    {
      path: '/exams',
      name: 'exams',
      meta: {
        requiresAuth: true,
        is_admin: false
      },
      component: () => import(/* webpackChunkName: "exams" */ '../views/Exams.vue')
    },
    {
      path: '/templatesummary',
      name: 'templatesummary',
      component: TemplateSummary,
      meta: {
        requiresAuth: true,
        is_admin: false
      },
    },
    {
      path: '/researchsummary',
      name: 'researchsummary',
      component: ResearchSummary,
      meta: {
        requiresAuth: true,
        is_admin: false
      },
    },
    {
      path: '/admin',
      name: 'admin',
      component: Admin,
      meta: {
        requiresAuth: true,
        is_admin: true
      },
    },
    {
      path: '/qckeys',
      name: 'qckeys',
      component: QCKeys,
      meta: {
        requiresAuth: true,
        is_admin: true
      },
    },
    {
      path: '/profile',
      name: 'profile',
      component: Profile,
      meta: {
        requiresAuth: true,
        is_admin: false
      },
    },
    {
      path: '/signout',
      name: 'signout',
      component: Signout,
      meta: {
        requiresAuth: true,
        is_admin: false
      },
    },


  ]
});


router.beforeEach((to, from, next) => {
  if (to.matched.some(record => record.meta.simple_layout)) {
    store.commit('SET_LAYOUT', 'simple-layout');
  } else {
    store.commit('SET_LAYOUT', 'app-layout');
  }

  if (to.matched.some(record => record.meta.requiresAuth)) {
    let role = localStorage.getItem('role');
    let jwt_exp = localStorage.getItem('jwt_exp') || (Date.now()) / 1000;
    let now = (Date.now()) / 1000 + 600;

    console.log("In router, role is set to", role);
    console.log("In router, jwt_exp is set to", jwt_exp);
    console.log("In router, jwt expiration is ", (now > jwt_exp));
    if (typeof (role) === 'undefined' || role === 'undefined' || role === 'guest' || !role || now > jwt_exp) {
      next({
        path: '/',

      })
    } else {
      if (to.matched.some(record => record.meta.is_admin)) {
        if (role === 'admin') {
          next()
        } else {
          next({name: 'signin'})
        }
      } else {
        next()
      }
    }
  } else {
    next()
  }
})

export default router