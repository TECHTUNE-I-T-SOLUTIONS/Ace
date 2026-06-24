import { Type, applyDecorators, Body, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';

export function CrudAuth() {
  return applyDecorators(UseGuards(JwtAuthGuard));
}

export abstract class CrudController<TDto extends { id?: string }, TService> {
  constructor(protected readonly service: any) {}
}
