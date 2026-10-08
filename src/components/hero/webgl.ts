interface NavigatorHints {
  connection?: { saveData?: boolean };
}

/**
 * Whether to load the 3D figure: WebGL available and the visitor is not on data saver.
 * Never throws; false in test DOMs.
 */
export function canRender3D(): boolean {
  try {
    if (typeof window === 'undefined' || typeof WebGLRenderingContext === 'undefined') return false;
    if ((navigator as Navigator & NavigatorHints).connection?.saveData) return false;
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2') ?? probe.getContext('webgl');
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}
