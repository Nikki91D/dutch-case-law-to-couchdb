/*
 * Copyright (c) 2015 IBM Corp. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file
 * except in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the
 * License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the License for the specific language governing permissions
 * and limitations under the License.
 */

package com.cloudant.client.api.model;


/**
 * Convenient base class for Cloudant documents, defines the basic
 * <code>id</code>, <code>revision</code> properties, and attachments.
 *
 * @author Ganesh K Choudhary
 * @since 0.0.1
 */
public class Document extends com.cloudant.client.org.lightcouch.Document {

    public void addAttachment(String name, Attachment attachment) {
        super.addAttachment(name, attachment.getAttachement());
    }

}
