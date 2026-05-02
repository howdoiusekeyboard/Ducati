/**
 * Simple test to verify Jest setup
 */

describe('Jest Setup Verification', () => {
  it('should run a simple test', () => {
    expect(1 + 1).toBe(2);
  });
  
  it('should handle basic assertions', () => {
    expect(true).toBeTruthy();
    expect(false).toBeFalsy();
    expect(null).toBeNull();
    expect(undefined).toBeUndefined();
  });
  
  it('should work with arrays and objects', () => {
    expect([1, 2, 3]).toHaveLength(3);
    expect({ name: 'test' }).toHaveProperty('name', 'test');
  });
});