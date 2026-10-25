import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { UpdateProfileDto } from './profile.dto';

describe('UpdateProfileDto.readingGoal', () => {
  const run = (v: unknown) => plainToInstance(UpdateProfileDto, { readingGoal: v });

  it('turns blank into null and numeric strings into numbers', () => {
    expect(run('').readingGoal).toBeNull();
    expect(run('12').readingGoal).toBe(12);
    expect(validateSync(run(''))).toHaveLength(0);
    expect(validateSync(run('12'))).toHaveLength(0);
  });

  it.each(['0', '501', 'x', '1.5'])('rejects %s', (v) => {
    expect(validateSync(run(v))).not.toHaveLength(0);
  });
});

describe('UpdateProfileDto.showReadingStats', () => {
  const run = (v: unknown) => plainToInstance(UpdateProfileDto, { showReadingStats: v });

  it('accepts booleans and omission', () => {
    expect(validateSync(run(true))).toHaveLength(0);
    expect(validateSync(run(false))).toHaveLength(0);
    expect(validateSync(plainToInstance(UpdateProfileDto, {}))).toHaveLength(0);
  });

  it.each(['yes', 1, null])('rejects %p', (v) => {
    expect(validateSync(run(v))).not.toHaveLength(0);
  });
});
