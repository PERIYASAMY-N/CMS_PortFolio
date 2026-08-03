/**
 * Admin Dashboard Logic
 */

// Use the same API base URL as the rest of the app
const ADMIN_API_BASE = (typeof API_BASE !== 'undefined' ? API_BASE : window.API_BASE_URL) || 'http://localhost:8080';

/* ── UI Core ── */
const ui = {
  toast(msg, type = 'success') {
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(() => el.classList.add('show'), 10);
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 300);
    }, 3000);
  },

  switchView(viewId) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const link = document.querySelector(`.nav-item[data-target="${viewId}"]`);
    if(link) {
      link.classList.add('active');
      document.getElementById('topbar-title').textContent = link.textContent.trim();
    }
  },

  // Modal helpers
  openModal(title, bodyHtml, footerHtml) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = bodyHtml;
    document.getElementById('modal-footer').innerHTML = footerHtml;
    document.getElementById('admin-modal').classList.add('open');
  },
  closeModal() {
    document.getElementById('admin-modal').classList.remove('open');
  },
  
  fmtDate(d) {
    return d ? new Date(d).toISOString().split('T')[0] : '';
  }
};

/* ── Dashboard Stats ── */
const vDashboard = {
  async load() {
    try {
      const res = await api.admin.stats();
      if (!res.success) throw new Error();
      const s = res.data;
      document.getElementById('dashboard-stats').innerHTML = `
        <div class="card stat-card">
          <div class="stat-icon blue"><i class="fas fa-folder-open"></i></div>
          <div class="stat-info"><span class="stat-label">Projects</span><span class="stat-value">${s.totalProjects}</span></div>
        </div>
        <div class="card stat-card">
          <div class="stat-icon green"><i class="fas fa-certificate"></i></div>
          <div class="stat-info"><span class="stat-label">Certificates</span><span class="stat-value">${s.totalCertificates}</span></div>
        </div>
        <div class="card stat-card">
          <div class="stat-icon orange"><i class="fas fa-code"></i></div>
          <div class="stat-info"><span class="stat-label">Skills</span><span class="stat-value">${s.totalSkills}</span></div>
        </div>
        <div class="card stat-card">
          <div class="stat-icon red"><i class="fas fa-envelope"></i></div>
          <div class="stat-info"><span class="stat-label">Unread Messages</span><span class="stat-value">${s.totalMessages}</span></div>
        </div>
      `;
      // Update sidebar badge
      const badge = document.getElementById('unread-badge');
      if (s.totalMessages > 0) {
        badge.textContent = s.totalMessages;
        badge.style.display = 'inline-block';
      } else {
        badge.style.display = 'none';
      }
    } catch {
      document.getElementById('dashboard-stats').innerHTML = `<p style="color:red">Failed to load stats.</p>`;
    }
  }
};

/* ── Profile ── */
const vProfile = {
  links: [],
  async load() {
    try {
      const res = await api.profile();
      if (!res.success) return;
      const p = res.data;
      document.getElementById('p-name').value = p.name || '';
      document.getElementById('p-title').value = p.title || '';
      document.getElementById('p-email').value = p.email || '';
      document.getElementById('p-phone').value = p.phone || '';
      document.getElementById('p-location').value = p.location || '';
      document.getElementById('p-bio').value = p.bio || '';
      document.getElementById('p-objective').value = p.careerObjective || '';
      document.getElementById('p-photo').value = p.profileImageUrl || '';
      if(p.profileImageUrl) { document.getElementById('p-photo-preview').src = ADMIN_API_BASE + p.profileImageUrl; document.getElementById('p-photo-preview').style.display='block'; }
      document.getElementById('p-hero').value = p.heroBackgroundUrl || '';
      if(p.heroBackgroundUrl) { document.getElementById('p-hero-preview').src = ADMIN_API_BASE + p.heroBackgroundUrl; document.getElementById('p-hero-preview').style.display='block'; }
      
      this.links = p.socialLinks || [];
      this.renderSocial();
    } catch (e) { ui.toast('Failed to load profile', 'error'); }
  },
  renderSocial() {
    document.getElementById('p-social-table').innerHTML = this.links.map((l, i) => `
      <tr>
        <td><input type="text" class="form-control" value="${l.platform}" onchange="vProfile.links[${i}].platform=this.value"></td>
        <td><input type="text" class="form-control" value="${l.icon}" onchange="vProfile.links[${i}].icon=this.value"></td>
        <td><input type="text" class="form-control" value="${l.url}" onchange="vProfile.links[${i}].url=this.value"></td>
        <td><button type="button" class="btn btn-danger" onclick="vProfile.delSocial(${i})"><i class="fas fa-trash"></i></button></td>
      </tr>
    `).join('');
  },
  addSocial() {
    this.links.push({platform:'', icon:'fas fa-link', url:''});
    this.renderSocial();
  },
  delSocial(i) {
    this.links.splice(i, 1);
    this.renderSocial();
  },
  async save() {
    // Determine if new profile image is selected
    const photoFile = document.getElementById('p-photo-file').files[0];
    if (photoFile) {
        ui.toast('Uploading profile photo...');
        const fd = new FormData(); fd.append('file', photoFile);
        try {
            const res = await fetch(ADMIN_API_BASE + '/api/admin/profile/image',  {
                method: 'PUT',
                headers: { 'Authorization': 'Bearer ' + api.getToken() },
                body: fd
            }).then(r => r.json());
            if (res.success) {
                document.getElementById('p-photo').value = res.data.profileImageUrl;
            }
        } catch (e) {
            console.error('Profile photo upload error', e);
        }
    }

    // Determine if new hero image is selected
    const heroFile = document.getElementById('p-hero-file').files[0];
    if (heroFile) {
        ui.toast('Uploading hero image...');
        const fd = new FormData(); fd.append('file', heroFile);
        try {
            const res = await fetch(ADMIN_API_BASE + '/api/admin/profile/hero-image',  {
                method: 'PUT',
                headers: { 'Authorization': 'Bearer ' + api.getToken() },
                body: fd
            }).then(r => r.json());
            if (res.success) {
                document.getElementById('p-hero').value = res.data.heroBackgroundUrl;
            }
        } catch (e) {
            console.error('Hero image upload error', e);
        }
    }

    const data = {
      name: document.getElementById('p-name').value,
      title: document.getElementById('p-title').value,
      email: document.getElementById('p-email').value,
      phone: document.getElementById('p-phone').value,
      location: document.getElementById('p-location').value,
      bio: document.getElementById('p-bio').value,
      careerObjective: document.getElementById('p-objective').value,
      profileImageUrl: document.getElementById('p-photo').value,
      heroBackgroundUrl: document.getElementById('p-hero').value,
      socialLinks: this.links
    };
    try {
      const res = await api.admin.updateProfile(data);
      if (res.success) { 
        ui.toast('Profile saved entirely'); 
        document.getElementById('p-photo-file').value = ''; 
        document.getElementById('p-hero-file').value = ''; 
      }
    } catch { ui.toast('Save failed', 'error'); }
  },
  async uploadImage(type) {
    const fileInput = document.getElementById(type === 'photo' ? 'p-photo-file' : 'p-hero-file');
    const f = fileInput.files[0];
    if(!f) { ui.toast('Choose a file first', 'error'); return; }
    const fd = new FormData(); fd.append('file', f);
    try {
      if (type === 'photo') {
        const res = await fetch(ADMIN_API_BASE + '/api/admin/profile/image',  {
          method: 'PUT',
          headers: { 'Authorization': 'Bearer ' + api.getToken() },
          body: fd
        }).then(r => r.json());
        if(res.success) {
          const newUrl = res.data.profileImageUrl;
          document.getElementById('p-photo').value = newUrl;
          // Update preview with cache-buster
          const preview = document.getElementById('p-photo-preview');
          preview.src = ADMIN_API_BASE + newUrl + '?t=' + Date.now();
          preview.style.display = 'block';
          fileInput.value = '';
          ui.toast('✅ Profile image saved to database!');
        } else {
          ui.toast('Upload failed: ' + (res.message || 'Unknown error'), 'error');
        }
      } else {
        const res = await fetch(ADMIN_API_BASE + '/api/admin/profile/hero-image',  {
          method: 'PUT',
          headers: { 'Authorization': 'Bearer ' + api.getToken() },
          body: fd
        }).then(r => r.json());
        if(res.success) {
          const newUrl = res.data.heroBackgroundUrl;
          document.getElementById('p-hero').value = newUrl;
          const preview = document.getElementById('p-hero-preview');
          preview.src = ADMIN_API_BASE + newUrl + '?t=' + Date.now();
          preview.style.display = 'block';
          fileInput.value = '';
          ui.toast('✅ Hero image saved to database!');
        } else {
          ui.toast('Upload failed: ' + (res.message || 'Unknown error'), 'error');
        }
      }
      } catch(e) { ui.toast('Upload failed: ' + e.message, 'error'); }
    },
};

/* ── Skills ── */
const vSkills = {
  items: [],
  async load() {
    const res = await api.skills();
    this.items = res.data || [];
    document.getElementById('skills-table').innerHTML = this.items.map(s => `
      <tr>
        <td><span class="badge badge-success">${s.category}</span></td>
        <td><strong>${s.name}</strong></td>
        <td>${s.percentage}%</td>
        <td><i class="${s.icon}"></i></td>
        <td>${s.sortOrder || 0}</td>
        <td>
          <button class="btn btn-outline" onclick='vSkills.openModal(${JSON.stringify(s).replace(/'/g, "&apos;")})'><i class="fas fa-edit"></i></button>
          <button class="btn btn-danger" onclick="vSkills.del(${s.id})"><i class="fas fa-trash"></i></button>
        </td>
      </tr>
    `).join('');
  },
  openModal(s = null) {
    const isEdit = !!s;
    const body = `
      <input type="hidden" id="sk-id" value="${s ? s.id : ''}">
      <div class="form-group"><label>Name</label><input type="text" id="sk-name" class="form-control" value="${s ? s.name : ''}"></div>
      <div class="form-group"><label>Category</label><input type="text" id="sk-cat" class="form-control" value="${s ? s.category : ''}"></div>
      <div class="form-group"><label>Percentage (0-100)</label><input type="number" id="sk-pct" class="form-control" value="${s ? s.percentage : 80}"></div>
      <div class="form-group"><label>Icon (FontAwesome)</label><input type="text" id="sk-icon" class="form-control" value="${s ? s.icon : 'fas fa-code'}"></div>
      <div class="form-group"><label>Sort Order</label><input type="number" id="sk-sort" class="form-control" value="${s ? s.sortOrder : 0}"></div>
    `;
    const footer = `
      <button class="btn btn-outline" onclick="ui.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="vSkills.save(${isEdit})">Save</button>
    `;
    ui.openModal(isEdit ? 'Edit Skill' : 'Add Skill', body, footer);
  },
  async save(isEdit) {
    const id = document.getElementById('sk-id').value;
    const data = {
      name: document.getElementById('sk-name').value,
      category: document.getElementById('sk-cat').value,
      percentage: parseInt(document.getElementById('sk-pct').value),
      icon: document.getElementById('sk-icon').value,
      sortOrder: parseInt(document.getElementById('sk-sort').value)
    };
    try {
      const res = isEdit ? await api.admin.updateSkill(id, data) : await api.admin.createSkill(data);
      if (res.success) { ui.toast('Skill saved'); ui.closeModal(); this.load(); }
    } catch { ui.toast('Save failed', 'error'); }
  },
  async del(id) {
    if(confirm('Delete this skill?')){
      if((await api.admin.deleteSkill(id)).success) { ui.toast('Deleted'); this.load(); }
    }
  }
};

/* ── Projects ── */
const vProjects = {
  items: [],
  async load() {
    const res = await api.projects();
    this.items = res.data || [];
    document.getElementById('projects-table').innerHTML = this.items.map(p => `
      <tr>
        <td>${p.featured ? '<span class="badge badge-warning">Featured</span>' : ''}</td>
        <td><strong>${p.title}</strong></td>
        <td>${ui.fmtDate(p.createdDate)}</td>
        <td>
          ${p.githubUrl ? `<a href="${p.githubUrl}" target="_blank" title="GitHub"><i class="fab fa-github"></i></a>` : ''}
          ${p.liveUrl ? `<a href="${p.liveUrl}" target="_blank" title="Live"><i class="fas fa-external-link-alt"></i></a>` : ''}
        </td>
        <td>
          <button class="btn btn-outline" onclick='vProjects.openModal(${JSON.stringify(p).replace(/'/g, "&apos;")})'><i class="fas fa-edit"></i></button>
          <button class="btn btn-danger" onclick="vProjects.del(${p.id})"><i class="fas fa-trash"></i></button>
        </td>
      </tr>
    `).join('');
  },
  openModal(p = null) {
    const isEdit = !!p;
    let techs = p && p.technologies ? p.technologies.join(', ') : '';
    this.currentImages = p && p.images ? JSON.parse(JSON.stringify(p.images)) : [];
    this.selectedFiles = [];

    const body = `
      <input type="hidden" id="pr-id" value="${p ? p.id : ''}">
      <div class="form-group"><label>Title</label><input type="text" id="pr-title" class="form-control" value="${p ? String(p.title).replace(/"/g, '&quot;') : ''}"></div>
      <div class="form-group"><label>Description</label><textarea id="pr-desc" class="form-control" rows="3">${p ? String(p.description || '').replace(/</g, '&lt;') : ''}</textarea></div>
      <div class="form-row">
        <div class="form-group"><label>GitHub URL</label><input type="text" id="pr-git" class="form-control" value="${p ? p.githubUrl || '' : ''}"></div>
        <div class="form-group"><label>Live URL</label><input type="text" id="pr-live" class="form-control" value="${p ? p.liveUrl || '' : ''}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Date</label><input type="date" id="pr-date" class="form-control" value="${ui.fmtDate(p ? p.createdDate : new Date())}"></div>
        <div class="form-group"><label>Featured</label>
          <select id="pr-feat" class="form-control"><option value="false">No</option><option value="true" ${p && p.featured ? 'selected' : ''}>Yes</option></select>
        </div>
      </div>
      <div class="form-group"><label>Technologies (comma separated)</label><input type="text" id="pr-tech" class="form-control" value="${techs}"></div>
      
      <div class="form-group">
        <label>Project Images (Select to upload on Save)</label>
        <input type="file" id="pr-img-file" accept="image/*" multiple class="form-control" onchange="vProjects.handleFileSelect(event)">
        <div id="pr-img-preview-container" style="display:flex; gap:10px; flex-wrap:wrap; margin-top:10px;"></div>
      </div>
    `;
    const footer = `
      <button class="btn btn-outline" onclick="ui.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="vProjects.save(${isEdit})">Save</button>
    `;
    ui.openModal(isEdit ? 'Edit Project' : 'Add Project', body, footer);
    setTimeout(() => vProjects.renderPreviews(), 50);
  },
  async save(isEdit) {
    console.log('PROJECT SAVE CLICKED');
    const id = document.getElementById('pr-id').value;
    const techs = document.getElementById('pr-tech').value.split(',').map(t=>t.trim()).filter(Boolean);

    const data = {
      title: document.getElementById('pr-title').value,
      description: document.getElementById('pr-desc').value,
      githubUrl: document.getElementById('pr-git').value,
      liveUrl: document.getElementById('pr-live').value,
      createdDate: document.getElementById('pr-date').value,
      featured: document.getElementById('pr-feat').value === 'true',
      technologies: techs,
      images: vProjects.currentImages || []
    };
    try {
      const res = isEdit ? await api.admin.updateProject(id, data) : await api.admin.createProject(data);
      if (res.success) { 
        const projectId = isEdit ? id : res.data.id;
        
        // Upload images if any are selected
        if (vProjects.selectedFiles && vProjects.selectedFiles.length > 0) {
          ui.toast('Uploading Project Images...');
          for (let f of vProjects.selectedFiles) {
            let fd = new FormData(); fd.append('file', f);
             try {
               await fetch(`${ADMIN_API_BASE}/api/admin/projects/${projectId}/image`, {
                 method: 'POST',
                 headers: { 'Authorization': 'Bearer ' + api.getToken() },
                 body: fd
               }).then(r => r.json());
             } catch (e) {
               console.error('Image upload error', e);
               ui.toast('Failed to upload some images', 'error');
             }
          }
          vProjects.selectedFiles = [];
          document.getElementById('pr-img-file').value = '';
        }
        
        ui.toast('Project saved safely'); 
        ui.closeModal(); 
        this.load(); 
      } else {
        console.error('Backend error:', res);
        ui.toast('Save failed: ' + (res.message || 'Unknown backend error'), 'error');
      }
    } catch (err) { 
        console.error('PROJECT SAVE ERROR:', err);
        ui.toast('Save failed due to network/server error', 'error'); 
    }
  },
  async del(id) {
    if(confirm('Delete project?')) {
      if((await api.admin.deleteProject(id)).success) { ui.toast('Deleted'); this.load(); }
    }
  },
  currentImages: [],
  selectedFiles: [],
  handleFileSelect(e) {
    this.selectedFiles = Array.from(e.target.files);
    this.renderPreviews();
  },
  removeSelectedImage(index, isExisting) {
    if (isExisting) {
      this.currentImages.splice(index, 1);
    } else {
      this.selectedFiles.splice(index, 1);
      // Sync file input
      const dt = new DataTransfer();
      this.selectedFiles.forEach(f => dt.items.add(f));
      document.getElementById('pr-img-file').files = dt.files;
    }
    this.renderPreviews();
  },
  renderPreviews() {
    const c = document.getElementById('pr-img-preview-container');
    if (!c) return;
    let html = '';
    // Render existing
    (this.currentImages||[]).forEach((img, i) => {
      let srcUrl = img.imageUrl.startsWith('http') ? img.imageUrl : ADMIN_API_BASE + img.imageUrl;
      srcUrl += '?t=' + Date.now();
      html += `<div style="position:relative; width:80px; height:80px; border:1px solid #ccc; display:flex; align-items:center; justify-content:center;">
        <img src="${srcUrl}" style="max-width:100%; max-height:100%;" />
        <button style="position:absolute; top:0; right:0; background:red; color:white; border:none; cursor:pointer;" onclick="vProjects.removeSelectedImage(${i}, true)">X</button>
      </div>`;
    });
    // Render selected files
    this.selectedFiles.forEach((file, i) => {
      html += `<div style="position:relative; width:80px; height:80px; border:1px dashed #666; display:flex; align-items:center; justify-content:center;">
        <img src="${window.URL.createObjectURL(file)}" style="max-width:100%; max-height:100%;" />
        <button style="position:absolute; top:0; right:0; background:red; color:white; border:none; cursor:pointer;" onclick="vProjects.removeSelectedImage(${i}, false)">X</button>
      </div>`;
    });
    c.innerHTML = html;
  },
  async uploadImages() {
    if (!this.selectedFiles || this.selectedFiles.length === 0) { ui.toast('No files to upload', 'error'); return; }
    const id = document.getElementById('pr-id').value;
    ui.toast('Uploading ' + this.selectedFiles.length + ' image(s)...');
    
    for (let f of this.selectedFiles) {
      let fd = new FormData(); fd.append('file', f);
      
      if (!id) {
        try {
           const res = await api.upload('/api/admin/media/upload?category=project', fd, true);
           if (res.success) {
             this.currentImages.push({ imageUrl: res.data.fileUrl, isPrimary: this.currentImages.length === 0 });
           }
        } catch (e) { console.error('Upload error', e); }
      } else {
        try {
           const res = await fetch(`${ADMIN_API_BASE}/api/admin/projects/${id}/image`, {
             method: 'POST',
             headers: { 'Authorization': 'Bearer ' + api.getToken() },
             body: fd
           }).then(r => r.json());
           if (res.success) {
              const proj = res.data;
              this.currentImages = proj.images.map(img => ({ imageUrl: img.imageUrl, isPrimary: img.isPrimary }));
           }
        } catch (e) { console.error('Upload error', e); }
      }
    }
    ui.toast(id ? '✅ Project updated with images!' : 'Upload complete. Save project to link.');
    this.selectedFiles = []; // Clear current selection
    document.getElementById('pr-img-file').value = '';
    this.renderPreviews();
    if(id) this.load(); // Refresh table data
  }
};

/* ── Generic Table Builders (Edu/Exp/Cert/Achieve) ── */
// I'll build Experience as an example, others are similar structure.
const vExperience = {
  async load() {
    const res = await api.experience();
    document.getElementById('exp-table').innerHTML = (res.data||[]).map(e => `
      <tr>
        <td><strong>${e.company}</strong></td>
        <td>${e.role}</td>
        <td><span class="badge badge-success">${e.type}</span></td>
        <td>${ui.fmtDate(e.startDate)} - ${e.current ? 'Present' : ui.fmtDate(e.endDate)}</td>
        <td>
          <button class="btn btn-outline" onclick='vExperience.openModal(${JSON.stringify(e).replace(/'/g, "&apos;")})'><i class="fas fa-edit"></i></button>
          <button class="btn btn-danger" onclick="vExperience.del(${e.id})"><i class="fas fa-trash"></i></button>
        </td>
      </tr>
    `).join('');
  },
  openModal(e = null) {
    const isEdit = !!e;
    const body = `
      <input type="hidden" id="ex-id" value="${e?e.id:''}">
      <div class="form-row">
        <div class="form-group"><label>Company</label><input type="text" id="ex-comp" class="form-control" value="${e?e.company:''}"></div>
        <div class="form-group"><label>Role</label><input type="text" id="ex-role" class="form-control" value="${e?e.role:''}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Type</label><input type="text" id="ex-type" class="form-control" value="${e?e.type||'Full-time':''}"></div>
        <div class="form-group"><label>Location</label><input type="text" id="ex-loc" class="form-control" value="${e?e.location||'':''}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Start Date</label><input type="date" id="ex-start" class="form-control" value="${ui.fmtDate(e?e.startDate:'')}"></div>
        <div class="form-group"><label>End Date</label><input type="date" id="ex-end" class="form-control" value="${ui.fmtDate(e?e.endDate:'')}"></div>
      </div>
      <div class="form-group">
        <label><input type="checkbox" id="ex-curr" ${e&&e.current?'checked':''}> Current Job</label>
      </div>
      <div class="form-group"><label>Description</label><textarea id="ex-desc" class="form-control" rows="3">${e?e.description||'':''}</textarea></div>
    `;
    ui.openModal(isEdit ? 'Edit Experience' : 'Add Experience', body, `
       <button class="btn btn-outline" onclick="ui.closeModal()">Cancel</button>
       <button class="btn btn-primary" onclick="vExperience.save(${isEdit})">Save</button>
    `);
  },
  async save(isEdit) {
    const d = {
      company: document.getElementById('ex-comp').value,
      role: document.getElementById('ex-role').value,
      type: document.getElementById('ex-type').value,
      location: document.getElementById('ex-loc').value,
      startDate: document.getElementById('ex-start').value || null,
      endDate: document.getElementById('ex-end').value || null,
      current: document.getElementById('ex-curr').checked,
      description: document.getElementById('ex-desc').value,
      sortOrder: 0
    };
    const id = document.getElementById('ex-id').value;
    const res = isEdit ? await api.admin.updateExperience(id, d) : await api.admin.createExperience(d);
    if(res.success){ ui.toast('Saved'); ui.closeModal(); this.load(); }
  },
  async del(id){ if(confirm('Delete?')){ await api.admin.deleteExperience(id); this.load(); } }
};

const vEducation = {
  async load() {
    const res = await api.education();
    document.getElementById('edu-table').innerHTML = (res.data||[]).map(e => `
      <tr>
        <td><strong>${e.institution}</strong></td>
        <td>${e.degree}</td>
        <td>${ui.fmtDate(e.startDate)} - ${e.current?'Present':ui.fmtDate(e.endDate)}</td>
        <td>${e.grade||''}</td>
        <td>
          <button class="btn btn-outline" onclick='vEducation.openModal(${JSON.stringify(e).replace(/'/g, "&apos;")})'><i class="fas fa-edit"></i></button>
          <button class="btn btn-danger" onclick="vEducation.del(${e.id})"><i class="fas fa-trash"></i></button>
        </td>
      </tr>
    `).join('');
  },
  openModal(e=null) {
    const isEdit=!!e;
    ui.openModal(isEdit?'Edit Edu':'Add Edu', `
      <input type="hidden" id="ed-id" value="${e?e.id:''}">
      <div class="form-group"><label>Institution</label><input type="text" id="ed-inst" class="form-control" value="${e?e.institution:''}"></div>
      <div class="form-row">
        <div class="form-group"><label>Degree</label><input type="text" id="ed-deg" class="form-control" value="${e?e.degree:''}"></div>
        <div class="form-group"><label>Field of Study</label><input type="text" id="ed-f" class="form-control" value="${e?e.fieldOfStudy||'':''}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Start Date</label><input type="date" id="ed-s" class="form-control" value="${ui.fmtDate(e?e.startDate:'')}"></div>
        <div class="form-group"><label>End Date</label><input type="date" id="ed-e" class="form-control" value="${ui.fmtDate(e?e.endDate:'')}"></div>
      </div>
      <div class="form-group"><label>Grade / GPA</label><input type="text" id="ed-g" class="form-control" value="${e?e.grade||'':''}"></div>
      <div class="form-group"><label><input type="checkbox" id="ed-c" ${e&&e.current?'checked':''}> Present</label></div>
      <div class="form-group"><label>Description</label><textarea id="ed-desc" class="form-control">${e?e.description||'':''}</textarea></div>
    `,`<button class="btn btn-outline" onclick="ui.closeModal()">Cancel</button><button class="btn btn-primary" onclick="vEducation.save(${isEdit})">Save</button>`);
  },
  async save(isEdit) {
    const d={institution:document.getElementById('ed-inst').value,degree:document.getElementById('ed-deg').value,fieldOfStudy:document.getElementById('ed-f').value,startDate:document.getElementById('ed-s').value||null,endDate:document.getElementById('ed-e').value||null,grade:document.getElementById('ed-g').value,current:document.getElementById('ed-c').checked,description:document.getElementById('ed-desc').value,sortOrder:0};
    const id=document.getElementById('ed-id').value;
    const res = isEdit?await api.admin.updateEducation(id,d):await api.admin.createEducation(d);
    if(res.success){ui.toast('Saved');ui.closeModal();this.load();}
  },
  async del(id){ if(confirm('Delete?')){ await api.admin.deleteEducation(id); this.load(); } }
};

const vCerts = {
  async load() {
    const res = await api.certificates();
    document.getElementById('certs-table').innerHTML = (res.data||[]).map(c => `
      <tr>
        <td><strong>${c.title}</strong></td><td>${c.organization}</td><td>${ui.fmtDate(c.issueDate)}</td>
        <td>
          <button class="btn btn-outline" onclick='vCerts.openModal(${JSON.stringify(c).replace(/'/g, "&apos;")})'><i class="fas fa-edit"></i></button>
          <button class="btn btn-danger" onclick="vCerts.del(${c.id})"><i class="fas fa-trash"></i></button>
        </td>
      </tr>
    `).join('');
  },
  openModal(c=null){
    const isEdit=!!c;
    ui.openModal(isEdit?'Edit Cert':'Add Cert',`
      <input type="hidden" id="c-id" value="${c?c.id:''}">
      <div class="form-group"><label>Title</label><input type="text" id="c-t" class="form-control" value="${c?c.title:''}"></div>
      <div class="form-group"><label>Organization</label><input type="text" id="c-o" class="form-control" value="${c?c.organization||'':''}"></div>
      <div class="form-row">
        <div class="form-group"><label>Issue Date</label><input type="date" id="c-d" class="form-control" value="${ui.fmtDate(c?c.issueDate:'')}"></div>
        <div class="form-group"><label>Credential ID</label><input type="text" id="c-cid" class="form-control" value="${c?c.credentialId||'':''}"></div>
      </div>
      <div class="form-group">
        <label>Credential URL</label><input type="text" id="c-u" class="form-control" value="${c?c.credentialUrl||'':''}">
      </div>
      <div class="form-group">
        <label>Certificate Image</label>
        <input type="hidden" id="c-img" class="form-control" value="${c?c.imageUrl||'':''}">
        <input type="file" id="c-img-file" accept="image/*" class="form-control" onchange="document.getElementById('c-img-preview').src=window.URL.createObjectURL(this.files[0]);document.getElementById('c-img-preview').style.display='block';">
        <img id="c-img-preview" src="${c && c.imageUrl ? ADMIN_API_BASE + c.imageUrl : ''}" style="max-height: 100px; display: ${c && c.imageUrl ? 'block' : 'none'}; margin-top: 10px;" />
        <button type="button" class="btn btn-outline" style="margin-top: 10px;" onclick="vCerts.uploadImage()">Upload Image</button>
      </div>
    `,`<button class="btn" onclick="ui.closeModal()">Cancel</button><button class="btn btn-primary" onclick="vCerts.save(${isEdit})">Save</button>`);
  },
  async save(isEdit){
    const d={title:document.getElementById('c-t').value,organization:document.getElementById('c-o').value,issueDate:document.getElementById('c-d').value||null,credentialId:document.getElementById('c-cid').value,credentialUrl:document.getElementById('c-u').value,imageUrl:document.getElementById('c-img').value};
    const id=document.getElementById('c-id').value;
    const res=isEdit?await api.admin.updateCert(id,d):await api.admin.createCert(d);
    if(res.success){
      const certId = isEdit ? id : res.data.id;
      const fileInput = document.getElementById('c-img-file');
      if (fileInput && fileInput.files[0]) {
         ui.toast('Uploading certificate image...');
         const fd = new FormData(); fd.append('file', fileInput.files[0]);
         try {
             await fetch(`${ADMIN_API_BASE}/api/admin/certificates/${certId}/image`, {
                 method: 'PUT',
                 headers: { 'Authorization': 'Bearer ' + api.getToken() },
                 body: fd
             });
         } catch(e) { console.error('Upload cert img fail', e); }
      }
      ui.toast('Saved safely');
      ui.closeModal();
      this.load();
    }
  },
  async uploadImage() {
    const id = document.getElementById('c-id').value;
    const fileInput = document.getElementById('c-img-file');
    const f = fileInput.files[0];
    if(!f) { ui.toast('Choose a file first', 'error'); return; }
    const fd = new FormData(); fd.append('file', f);
    
    if (!id) {
      try {
        const res = await api.upload('/api/admin/media/upload?category=certificate', fd, true);
        if(res.success) {
          document.getElementById('c-img').value = res.data.fileUrl;
          ui.toast('Image uploaded. Click Save to link it.');
        }
      } catch { ui.toast('Upload failed', 'error'); }
    } else {
      try {
        const res = await fetch(`${ADMIN_API_BASE}/api/admin/certificates/${id}/image`, {
          method: 'PUT',
          headers: { 'Authorization': 'Bearer ' + api.getToken() },
          body: fd
        }).then(r => r.json());
        if(res.success) {
          document.getElementById('c-img').value = res.data.imageUrl;
          ui.toast('✅ Image saved to database!');
          vCerts.load();
        } else {
          ui.toast('Upload failed', 'error');
        }
      } catch { ui.toast('Upload failed', 'error'); }
    }
  },
  async del(id){ if(confirm('Delete?')){ await api.admin.deleteCert(id); this.load(); } }
};

const vAchieve = {
  async load() {
    const res = await api.achievements();
    document.getElementById('achieve-table').innerHTML = (res.data||[]).map(a => `
      <tr>
        <td><strong>${a.title}</strong></td><td><span class="badge badge-success">${a.category||'Other'}</span></td><td>${ui.fmtDate(a.date)}</td>
        <td>
          <button class="btn btn-outline" onclick='vAchieve.openModal(${JSON.stringify(a).replace(/'/g, "&apos;")})'><i class="fas fa-edit"></i></button>
          <button class="btn btn-danger" onclick="vAchieve.del(${a.id})"><i class="fas fa-trash"></i></button>
        </td>
      </tr>
    `).join('');
  },
  openModal(a=null){
    const isEdit=!!a;
    ui.openModal(isEdit?'Edit':'Add',`
      <input type="hidden" id="a-id" value="${a?a.id:''}">
      <div class="form-group"><label>Title</label><input type="text" id="a-t" class="form-control" value="${a?a.title:''}"></div>
      <div class="form-row">
        <div class="form-group"><label>Category</label><input type="text" id="a-c" class="form-control" value="${a?a.category||'':''}"></div>
        <div class="form-group"><label>Date</label><input type="date" id="a-d" class="form-control" value="${ui.fmtDate(a?a.date:'')}"></div>
      </div>
      <div class="form-group"><label>Icon</label><input type="text" id="a-i" class="form-control" value="${a?a.icon||'fas fa-trophy':'fas fa-trophy'}"></div>
      <div class="form-group"><label>Desc</label><textarea id="a-desc" class="form-control">${a?a.description||'':''}</textarea></div>
      <div class="form-group">
        <label>Achievement Image</label>
        <input type="hidden" id="a-img" class="form-control" value="${a?a.imageUrl||'':''}">
        <input type="file" id="a-img-file" accept="image/*" class="form-control" onchange="document.getElementById('a-img-preview').src=window.URL.createObjectURL(this.files[0]);document.getElementById('a-img-preview').style.display='block';">
        <img id="a-img-preview" src="${a && a.imageUrl ? ADMIN_API_BASE + a.imageUrl : ''}" style="max-height: 100px; display: ${a && a.imageUrl ? 'block' : 'none'}; margin-top: 10px;" />
        <button type="button" class="btn btn-outline" style="margin-top: 10px;" onclick="vAchieve.uploadImage()">Upload Image</button>
      </div>
    `,`<button class="btn" onclick="ui.closeModal()">Cancel</button><button class="btn btn-primary" onclick="vAchieve.save(${isEdit})">Save</button>`);
  },
  async save(isEdit){
    const d={title:document.getElementById('a-t').value,category:document.getElementById('a-c').value,date:document.getElementById('a-d').value||null,icon:document.getElementById('a-i').value,description:document.getElementById('a-desc').value,sortOrder:0,imageUrl:document.getElementById('a-img').value};
    const id=document.getElementById('a-id').value;
    const res=isEdit?await api.admin.updateAchievement(id,d):await api.admin.createAchievement(d);
    if(res.success){
      const achieveId = isEdit ? id : res.data.id;
      const fileInput = document.getElementById('a-img-file');
      if (fileInput && fileInput.files[0]) {
         ui.toast('Uploading achievement image...');
         const fd = new FormData(); fd.append('file', fileInput.files[0]);
         try {
             await fetch(`${ADMIN_API_BASE}/api/admin/achievements/${achieveId}/image`, {
                 method: 'PUT',
                 headers: { 'Authorization': 'Bearer ' + api.getToken() },
                 body: fd
             });
         } catch(e) { console.error('Upload ach img fail', e); }
      }
      ui.toast('Saved safely');
      ui.closeModal();
      this.load();
    }
  },
  async uploadImage() {
    const id = document.getElementById('a-id').value;
    const fileInput = document.getElementById('a-img-file');
    const f = fileInput.files[0];
    if(!f) { ui.toast('Choose a file first', 'error'); return; }
    const fd = new FormData(); fd.append('file', f);
    
    if (!id) {
      try {
        const res = await api.upload('/api/admin/media/upload?category=achievements', fd, true);
        if(res.success) {
          document.getElementById('a-img').value = res.data.fileUrl;
          ui.toast('Image uploaded. Click Save to link it.');
        }
      } catch { ui.toast('Upload failed', 'error'); }
    } else {
      try {
        const res = await fetch(`${ADMIN_API_BASE}/api/admin/achievements/${id}/image`, {
          method: 'PUT',
          headers: { 'Authorization': 'Bearer ' + api.getToken() },
          body: fd
        }).then(r => r.json());
        if(res.success) {
          document.getElementById('a-img').value = res.data.imageUrl;
          ui.toast('✅ Image saved to database!');
          vAchieve.load();
        } else {
          ui.toast('Upload failed', 'error');
        }
      } catch { ui.toast('Upload failed', 'error'); }
    }
  },
  async del(id){ if(confirm('Delete?')){ await api.admin.deleteAchievement(id); this.load(); } }
};

/* ── Messages ── */
const vMessages = {
  async load(archived = false) {
    const res = archived ? await api.admin.archivedMessages() : await api.admin.messages();
    const msgs = res.data || [];
    const html = msgs.length === 0 ? '<p>No messages found.</p>' : msgs.map(m => `
      <div style="padding:16px; border:1px solid var(--admin-border); border-radius:8px; margin-bottom:12px; background:${m.isRead?'var(--admin-surface)':'#e3f2fd'};">
        <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
          <div><strong style="margin-right:12px;">${m.name}</strong> <a href="mailto:${m.email}">${m.email}</a></div>
          <div style="color:var(--admin-text-light); font-size:0.85rem;">${new Date(m.createdAt).toLocaleString()}</div>
        </div>
        <div style="font-weight:600; margin-bottom:8px;">${m.subject||'No Subject'}</div>
        <p style="white-space:pre-wrap; margin-bottom:16px; color:var(--admin-text-light);">${m.body}</p>
        <div style="display:flex; gap:8px;">
          ${!m.isRead ? `<button class="btn btn-primary btn-sm" onclick="vMessages.markRead(${m.id}, ${archived})">Mark Read</button>` : ''}
          ${!m.isArchived ? `<button class="btn btn-outline btn-sm" onclick="vMessages.archive(${m.id})">Archive</button>` : ''}
          <button class="btn btn-danger btn-sm" onclick="vMessages.del(${m.id}, ${archived})"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    `).join('');
    document.getElementById('messages-container').innerHTML = html;
    vDashboard.load(); // refresh badge
  },
  async markRead(id, arch){ await api.admin.markRead(id); this.load(arch); },
  async archive(id){ await api.admin.archiveMessage(id); this.load(false); },
  async del(id, arch){ if(confirm('Delete message?')){ await api.admin.deleteMessage(id); this.load(arch); } }
};

/* ── Resume ── */
const vResume = {
  async load() {
    const res = await api.admin.allResumes();
    document.getElementById('resume-table').innerHTML = (res.data||[]).map(r => `
      <tr style="background:${r.isActive? '#f0fdf4' : ''}">
        <td><strong>${r.version}</strong></td>
        <td><a href="${ADMIN_API_BASE}${r.fileUrl}" target="_blank">${r.fileName}</a></td>
        <td>${new Date(r.uploadedAt).toLocaleString()}</td>
        <td>${r.isActive ? '<span class="badge badge-success">Active</span>' : '<span class="badge" style="background:#e2e8f0;color:#64748b;">Archived</span>'}</td>
        <td>
          ${!r.isActive ? `<button class="btn btn-outline" onclick="vResume.activate(${r.id})">Make Active</button>` : ''}
        </td>
      </tr>
    `).join('');
  },
  async activate(id) { await api.admin.activateResume(id); ui.toast('Resume activated'); this.load(); }
};

/* ── Media ── */
const vMedia = {
  async load() {
    const res = await api.admin.media();
    const mediaUrlBase = ADMIN_API_BASE;
    document.getElementById('media-grid').innerHTML = (res.data||[]).map(m => `
      <div class="media-item">
        <img src="${mediaUrlBase}${m.fileUrl}" alt="${m.fileName}">
        <div class="media-actions">
          <button class="btn btn-primary" style="padding:4px 8px;" onclick="navigator.clipboard.writeText('${mediaUrlBase}${m.fileUrl}'); ui.toast('URL Copied!')"><i class="fas fa-copy"></i></button>
          <button class="btn btn-danger" style="padding:4px 8px;" onclick="vMedia.del(${m.id})"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    `).join('');
  },
  async del(id) { if(confirm('Delete file permanently?')){ await api.admin.deleteMedia(id); this.load(); } }
};

/* ── Settings ── */
const vSettings = {
  async load() {
    const res = await api.settings();
    const map = {};
    (res.data||[]).forEach(s => map[s.settingKey] = s.settingValue);
    document.getElementById('set-title').value = map['site_title'] || '';
    document.getElementById('set-desc').value = map['meta_description'] || '';
    document.getElementById('set-color').value = map['theme_color'] || '#6c63ff';
    document.getElementById('set-dark').value = map['dark_mode'] || 'true';
  },
  async save() {
    const d = {
      site_title: document.getElementById('set-title').value,
      meta_description: document.getElementById('set-desc').value,
      theme_color: document.getElementById('set-color').value,
      dark_mode: document.getElementById('set-dark').value
    };
    const res = await api.admin.updateSettings(d);
    if(res.success){ ui.toast('Settings saved'); this.load(); }
  }
};

/* ── Init ── */
document.addEventListener('DOMContentLoaded', () => {
  if (typeof checkAuth !== 'undefined') checkAuth();

  // Load initial view
  vDashboard.load();
  vProfile.load();
  vSkills.load();
  vProjects.load();
  vExperience.load();
  vEducation.load();
  vCerts.load();
  vAchieve.load();
  vSettings.load();

  // Navigation Routing
  document.getElementById('sidebar-nav').addEventListener('click', (e) => {
    const link = e.target.closest('.nav-item');
    if (!link) return;
    e.preventDefault();
    const target = link.dataset.target;
    ui.switchView(target);
    
    // View-specific lazy loads
    if(target === 'v-messages') vMessages.load();
    if(target === 'v-resume') vResume.load();
    if(target === 'v-media') vMedia.load();
  });

  // Resume Upload
  const rForm = document.getElementById('resume-upload-form');
  if(rForm) rForm.addEventListener('submit', async(e) => {
    e.preventDefault();
    const f = document.getElementById('resume-file').files[0];
    if(!f) return;
    const fd = new FormData(); fd.append('file', f);
    try {
      const res = await api.upload('/api/admin/resume/upload', fd, true);
      if(res.success){ ui.toast('Resume uploaded'); rForm.reset(); vResume.load(); }
    } catch { ui.toast('Upload failed', 'error'); }
  });

  // Media Upload
  const mForm = document.getElementById('media-upload-form');
  if(mForm) mForm.addEventListener('submit', async(e) => {
    e.preventDefault();
    const f = document.getElementById('media-file').files[0];
    const cat = document.getElementById('media-category').value;
    if(!f) return;
    const fd = new FormData(); fd.append('file', f);
    try {
      const res = await api.upload(`/api/admin/media/upload?category=${cat}`, fd, true);
      if(res.success){ ui.toast('Media uploaded'); mForm.reset(); vMedia.load(); }
    } catch { ui.toast('Upload failed', 'error'); }
  });
});
